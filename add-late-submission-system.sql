-- ==========================================
-- LATE SUBMISSION SYSTEM WITH PENALTIES
-- ==========================================
-- Sistema de submissões atrasadas com:
-- 1. Janela de 15 minutos adicional após deadline
-- 2. Penalidades progressivas: 5min=-5pts, 5-10min=-10pts, 10-15min=-15pts
-- 3. Bloqueio automático de submissões após 15 minutos

-- PASSO 1: Adicionar campos à tabela submissions
-- ==========================================
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS late_minutes INTEGER,
ADD COLUMN IF NOT EXISTS late_penalty_applied INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quest_deadline TIMESTAMP;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_submissions_is_late ON submissions(is_late);
CREATE INDEX IF NOT EXISTS idx_submissions_late_penalty ON submissions(late_penalty_applied);
CREATE INDEX IF NOT EXISTS idx_submissions_team_quest ON submissions(team_id, quest_id);

-- PASSO 2: Adicionar campos à tabela quests para controlar deadline
-- ==========================================
ALTER TABLE quests
ADD COLUMN IF NOT EXISTS planned_deadline_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_submission_window_minutes INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS allow_late_submissions BOOLEAN DEFAULT TRUE;

-- PASSO 3: Criar função para calcular deadline de uma quest
-- ==========================================
CREATE OR REPLACE FUNCTION calculate_quest_deadline(
  quest_id_param UUID
)
RETURNS TIMESTAMP AS $$
DECLARE
  v_quest_record RECORD;
  v_phase_record RECORD;
  v_phase_start_time TIMESTAMP;
  v_deadline TIMESTAMP;
BEGIN
  -- Buscar dados da quest
  SELECT
    q.id,
    q.phase_id,
    q.started_at,
    q.planned_deadline_minutes,
    p.duration_minutes
  INTO v_quest_record
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE q.id = quest_id_param;

  IF v_quest_record.started_at IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calcular deadline como: started_at + planned_deadline_minutes
  v_deadline := v_quest_record.started_at + (v_quest_record.planned_deadline_minutes || ' minutes')::interval;

  RETURN v_deadline;
END;
$$ LANGUAGE plpgsql STABLE;

-- PASSO 4: Criar função para calcular penalidade por atraso
-- ==========================================
CREATE OR REPLACE FUNCTION calculate_late_penalty(
  late_minutes_param INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_penalty INTEGER;
BEGIN
  -- Penalidades progressivas:
  -- 0-5 minutos: 5 pontos
  -- 5-10 minutos: 10 pontos
  -- 10-15 minutos: 15 pontos
  IF late_minutes_param IS NULL OR late_minutes_param <= 0 THEN
    RETURN 0;
  ELSIF late_minutes_param <= 5 THEN
    RETURN 5;
  ELSIF late_minutes_param <= 10 THEN
    RETURN 10;
  ELSIF late_minutes_param <= 15 THEN
    RETURN 15;
  ELSE
    -- Mais de 15 minutos: rejeitar (null indica não permitido)
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASSO 5: Criar função para validar se submissão é permitida
-- ==========================================
CREATE OR REPLACE FUNCTION validate_submission_allowed(
  team_id_param UUID,
  quest_id_param UUID,
  OUT is_allowed BOOLEAN,
  OUT reason TEXT,
  OUT late_minutes_calculated INTEGER,
  OUT penalty_calculated INTEGER,
  OUT debug_now TIMESTAMP,
  OUT debug_deadline TIMESTAMP,
  OUT debug_late_window_end TIMESTAMP,
  OUT debug_v_minutes_late INTEGER,
  OUT debug_v_penalty INTEGER
)
AS $$
DECLARE
  v_quest RECORD;
  v_deadline TIMESTAMP;
  v_now TIMESTAMP;
  v_late_window_end TIMESTAMP;
  v_minutes_late INTEGER;
  v_penalty INTEGER;
BEGIN
  v_now := NOW() AT TIME ZONE 'UTC';
  debug_now := v_now;

  -- Buscar dados da quest
  SELECT
    id,
    status,
    started_at,
    ended_at,
    planned_deadline_minutes,
    late_submission_window_minutes,
    allow_late_submissions
  INTO v_quest
  FROM quests
  WHERE id = quest_id_param;

  -- Validação 1: Quest existe?
  IF v_quest.id IS NULL THEN
    is_allowed := FALSE;
    reason := 'Quest não encontrada';
    RETURN;
  END IF;

  -- Validação 2: Quest está ativa ou fechada (mas com janela de atraso)?
  IF v_quest.status NOT IN ('active', 'closed') THEN
    is_allowed := FALSE;
    reason := 'Quest não está disponível para submissão';
    RETURN;
  END IF;

  -- Validação 3: Quest foi iniciada?
  IF v_quest.started_at IS NULL THEN
    is_allowed := FALSE;
    reason := 'Quest ainda não começou';
    RETURN;
  END IF;

  -- Calcular deadline
  v_deadline := v_quest.started_at + (v_quest.planned_deadline_minutes || ' minutes')::interval;
  v_late_window_end := v_deadline + (v_quest.late_submission_window_minutes || ' minutes')::interval;

  -- Validação 4: Não passou da janela de atraso?
  IF v_now > v_late_window_end THEN
    is_allowed := FALSE;
    reason := 'Prazo para submissão expirou completamente';
    RETURN;
  END IF;

  -- Calcular minutos de atraso
  IF v_now > v_deadline THEN
    v_minutes_late := EXTRACT(EPOCH FROM (v_now - v_deadline))::INTEGER / 60;
    v_penalty := calculate_late_penalty(v_minutes_late);

    -- Se a penalidade é NULL, significa que passou de 15 minutos
    IF v_penalty IS NULL THEN
      is_allowed := FALSE;
      reason := 'Prazo para submissão expirou';
      RETURN;
    END IF;

    is_allowed := TRUE;
    reason := 'Submissão atrasada, será aplicada penalidade';
    late_minutes_calculated := v_minutes_late;
    penalty_calculated := v_penalty;
  ELSE
    is_allowed := TRUE;
    reason := 'No prazo';
    late_minutes_calculated := 0;
    penalty_calculated := 0;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- PASSO 6: Trigger para atualizar campos de atraso na submissão
-- ==========================================
CREATE OR REPLACE FUNCTION update_late_submission_fields()
RETURNS TRIGGER AS $$
DECLARE
  v_deadline TIMESTAMP;
  v_minutes_late INTEGER;
  v_penalty INTEGER;
BEGIN
  -- Calcular deadline da quest
  v_deadline := calculate_quest_deadline(NEW.quest_id);
  NEW.quest_deadline := v_deadline;

  -- Se deadline foi calculado e está no passado, marcar como atrasada
  IF v_deadline IS NOT NULL AND NEW.submitted_at > v_deadline THEN
    NEW.is_late := TRUE;
    v_minutes_late := EXTRACT(EPOCH FROM (NEW.submitted_at - v_deadline))::INTEGER / 60;
    NEW.late_minutes := v_minutes_late;
    NEW.late_penalty_applied := calculate_late_penalty(v_minutes_late);
  ELSE
    NEW.is_late := FALSE;
    NEW.late_minutes := 0;
    NEW.late_penalty_applied := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar trigger antigo se existir
DROP TRIGGER IF EXISTS update_late_submission_fields_trigger ON submissions;

-- Criar novo trigger
CREATE TRIGGER update_late_submission_fields_trigger
BEFORE INSERT OR UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_late_submission_fields();

-- PASSO 7: Criar função para bloquear submissões sequenciais
-- ==========================================
CREATE OR REPLACE FUNCTION check_previous_quest_submitted(
  team_id_param UUID,
  quest_id_param UUID,
  OUT can_submit BOOLEAN,
  OUT reason TEXT
)
AS $$
DECLARE
  v_current_quest RECORD;
  v_previous_quest_id UUID;
  v_previous_submission_count INTEGER;
BEGIN
  -- Buscar a quest atual e sua ordem
  SELECT
    id,
    phase_id,
    order_index
  INTO v_current_quest
  FROM quests
  WHERE id = quest_id_param;

  IF v_current_quest.id IS NULL THEN
    can_submit := FALSE;
    reason := 'Quest não encontrada';
    RETURN;
  END IF;

  -- Se é a primeira quest da fase, permitir
  IF v_current_quest.order_index = 1 THEN
    can_submit := TRUE;
    reason := 'Primeira quest da fase';
    RETURN;
  END IF;

  -- Encontrar a quest anterior na mesma fase
  SELECT id INTO v_previous_quest_id
  FROM quests
  WHERE phase_id = v_current_quest.phase_id
    AND order_index = v_current_quest.order_index - 1
  LIMIT 1;

  IF v_previous_quest_id IS NULL THEN
    can_submit := TRUE;
    reason := 'Nenhuma quest anterior encontrada';
    RETURN;
  END IF;

  -- Verificar se a equipe já enviou a quest anterior
  SELECT COUNT(*) INTO v_previous_submission_count
  FROM submissions
  WHERE team_id = team_id_param
    AND quest_id = v_previous_quest_id;

  IF v_previous_submission_count > 0 THEN
    can_submit := TRUE;
    reason := 'Quest anterior já foi submetida';
  ELSE
    can_submit := FALSE;
    reason := 'Você deve primeiro enviar a quest anterior';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- PASSO 8: Criar função para verificar se janela de atraso ainda está aberta
-- ==========================================
CREATE OR REPLACE FUNCTION is_late_submission_window_open(
  quest_id_param UUID,
  OUT window_open BOOLEAN,
  OUT minutes_remaining INTEGER
)
AS $$
DECLARE
  v_quest RECORD;
  v_deadline TIMESTAMP;
  v_late_window_end TIMESTAMP;
  v_now TIMESTAMP;
BEGIN
  v_now := NOW();

  SELECT
    id,
    started_at,
    planned_deadline_minutes,
    late_submission_window_minutes
  INTO v_quest
  FROM quests
  WHERE id = quest_id_param;

  IF v_quest.id IS NULL THEN
    window_open := FALSE;
    minutes_remaining := 0;
    RETURN;
  END IF;

  IF v_quest.started_at IS NULL THEN
    window_open := FALSE;
    minutes_remaining := 0;
    RETURN;
  END IF;

  v_deadline := v_quest.started_at + (v_quest.planned_deadline_minutes || ' minutes')::interval;
  v_late_window_end := v_deadline + (v_quest.late_submission_window_minutes || ' minutes')::interval;

  IF v_now < v_late_window_end THEN
    window_open := TRUE;
    minutes_remaining := EXTRACT(EPOCH FROM (v_late_window_end - v_now))::INTEGER / 60;
  ELSE
    window_open := FALSE;
    minutes_remaining := 0;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- PASSO 9: Criar view para rastrear submissões atrasadas
-- ==========================================
DROP VIEW IF EXISTS late_submissions_summary CASCADE;

CREATE VIEW late_submissions_summary AS
SELECT
  s.id as submission_id,
  s.team_id,
  t.name as team_name,
  s.quest_id,
  q.name as quest_name,
  p.name as phase_name,
  s.submitted_at,
  s.quest_deadline,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  CASE
    WHEN s.late_minutes IS NULL OR s.late_minutes = 0 THEN 'No prazo'
    WHEN s.late_minutes <= 5 THEN '0-5 min (-5pts)'
    WHEN s.late_minutes <= 10 THEN '5-10 min (-10pts)'
    WHEN s.late_minutes <= 15 THEN '10-15 min (-15pts)'
    ELSE 'Além do limite'
  END as late_category
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
JOIN phases p ON q.phase_id = p.id
WHERE s.is_late = TRUE
ORDER BY s.submitted_at DESC;

GRANT SELECT ON late_submissions_summary TO anon;
GRANT SELECT ON late_submissions_summary TO authenticated;

-- PASSO 10: Dados de exemplo (opcional)
-- ==========================================
-- Configurar quest 1 da fase 1 com 30 minutos de prazo
UPDATE quests
SET
  planned_deadline_minutes = 30,
  late_submission_window_minutes = 15,
  allow_late_submissions = TRUE
WHERE order_index = 1
  AND phase_id IN (SELECT id FROM phases WHERE order_index = 1);

-- PASSO 11: Mensagem de sucesso
-- ==========================================
SELECT 'Late Submission System com penalidades progressivas instalado com sucesso!' as status;
