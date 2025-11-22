-- ============================================================================
-- FIX CRITICAL: Corrigir função de penalidade para aceitar SEGUNDOS
-- ============================================================================
-- PROBLEMA: A janela de atraso estava bloqueando equipes porque:
-- 1. Equipe submete 45 segundos após deadline
-- 2. 45 / 60 = 0 minutos (inteiros truncam)
-- 3. penalty(0) retorna 0, mas isso era válido para "no prazo"
-- 4. API retornava erro porque achava que não era atraso válido
--
-- SOLUÇÃO: Passar SEGUNDOS para calculate_late_penalty() e converter lá
-- ============================================================================

-- PASSO 1: Recriar função para aceitar SEGUNDOS
DROP FUNCTION IF EXISTS calculate_late_penalty(INTEGER);

CREATE OR REPLACE FUNCTION calculate_late_penalty(
  late_seconds_param INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_minutes INTEGER;
BEGIN
  -- Converter segundos para minutos (arredonda para cima)
  v_minutes := CEIL(late_seconds_param::DECIMAL / 60)::INTEGER;

  -- Penalidades progressivas:
  -- 0-5 minutos: 5 pontos
  -- 5-10 minutos: 10 pontos
  -- 10-15 minutos: 15 pontos
  IF late_seconds_param IS NULL OR late_seconds_param <= 0 THEN
    RETURN 0;
  ELSIF v_minutes <= 5 THEN
    RETURN 5;
  ELSIF v_minutes <= 10 THEN
    RETURN 10;
  ELSIF v_minutes <= 15 THEN
    RETURN 15;
  ELSE
    -- Mais de 15 minutos: rejeitar (null indica não permitido)
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASSO 2: Atualizar função validate_submission_allowed()
-- ⚠️ IMPORTANTE: Dropar antes de recriar para evitar conflito de tipos
DROP FUNCTION IF EXISTS validate_submission_allowed(UUID, UUID);

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
  v_seconds_late INTEGER;
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
    -- ✅ CRITICAL FIX: Calcular em SEGUNDOS, não minutos
    v_seconds_late := EXTRACT(EPOCH FROM (v_now - v_deadline))::INTEGER;
    v_minutes_late := CEIL(v_seconds_late::DECIMAL / 60)::INTEGER;
    -- Passar SEGUNDOS para a função (ela converte internamente)
    v_penalty := calculate_late_penalty(v_seconds_late);

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

  debug_deadline := v_deadline;
  debug_late_window_end := v_late_window_end;
  debug_v_minutes_late := v_minutes_late;
  debug_v_penalty := v_penalty;
END;
$$ LANGUAGE plpgsql STABLE;

-- PASSO 3: Atualizar TRIGGER para passar SEGUNDOS
CREATE OR REPLACE FUNCTION update_late_submission_fields()
RETURNS TRIGGER AS $$
DECLARE
  v_deadline TIMESTAMP;
  v_seconds_late INTEGER;
  v_minutes_late INTEGER;
BEGIN
  -- Calcular deadline da quest
  v_deadline := calculate_quest_deadline(NEW.quest_id);
  NEW.quest_deadline := v_deadline;

  -- Se deadline foi calculado e está no passado, marcar como atrasada
  IF v_deadline IS NOT NULL AND NEW.submitted_at > v_deadline THEN
    NEW.is_late := TRUE;
    -- ✅ CRITICAL FIX: Calcular em SEGUNDOS
    v_seconds_late := EXTRACT(EPOCH FROM (NEW.submitted_at - v_deadline))::INTEGER;
    v_minutes_late := CEIL(v_seconds_late::DECIMAL / 60)::INTEGER;
    NEW.late_minutes := v_minutes_late;
    -- Passar SEGUNDOS para a função
    NEW.late_penalty_applied := calculate_late_penalty(v_seconds_late);
  ELSE
    NEW.is_late := FALSE;
    NEW.late_minutes := 0;
    NEW.late_penalty_applied := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 4: Recriar trigger
DROP TRIGGER IF EXISTS update_late_submission_fields_trigger ON submissions;

CREATE TRIGGER update_late_submission_fields_trigger
BEFORE INSERT OR UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_late_submission_fields();

-- PASSO 5: Testar a função com vários cenários
-- (Agora recebe SEGUNDOS em vez de MINUTOS)

SELECT
  'TESTE: 10 segundos' as teste,
  calculate_late_penalty(10) as penalty,
  'Esperado: 5' as esperado
UNION ALL
SELECT '30 segundos', calculate_late_penalty(30), '5'
UNION ALL
SELECT '60 segundos (1 min)', calculate_late_penalty(60), '5'
UNION ALL
SELECT '300 segundos (5 min)', calculate_late_penalty(300), '5'
UNION ALL
SELECT '360 segundos (6 min)', calculate_late_penalty(360), '10'
UNION ALL
SELECT '660 segundos (11 min)', calculate_late_penalty(660), '15'
UNION ALL
SELECT '1000 segundos (16+ min)', calculate_late_penalty(1000), 'NULL';

-- PASSO 6: (OPCIONAL) Recalcular submissões existentes que foram bloqueadas
-- Descomente se quiser corrigir dados históricos
/*
UPDATE submissions s
SET
  late_minutes = CEIL(EXTRACT(EPOCH FROM (s.submitted_at - (
    SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
    FROM quests q WHERE q.id = s.quest_id
  )))::DECIMAL / 60)::INTEGER,
  late_penalty_applied = (
    SELECT calculate_late_penalty(
      EXTRACT(EPOCH FROM (s.submitted_at - (
        SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
        FROM quests q WHERE q.id = s.quest_id
      )))::INTEGER
    )
  )
WHERE s.is_late = TRUE
ORDER BY s.submitted_at DESC;
*/
