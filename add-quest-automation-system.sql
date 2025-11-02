-- ==========================================
-- QUEST AUTOMATION SYSTEM
-- ==========================================
-- Transforma o sistema de controle baseado em Phases
-- para um sistema baseado em Quests com automação

-- PASSO 1: Adicionar campos à tabela quests para controle individual
-- ==========================================
ALTER TABLE quests
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, active, closed, completed
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS started_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS auto_start_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_start_delay_minutes INTEGER DEFAULT 0;

-- PASSO 2: Criar índices para performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_phase_status ON quests(phase_id, status);
CREATE INDEX IF NOT EXISTS idx_quests_started_at ON quests(started_at);

-- PASSO 3: Renovar a tabela event_config com campos específicos para quests
-- ==========================================
ALTER TABLE event_config
ADD COLUMN IF NOT EXISTS active_quest_id UUID REFERENCES quests(id),
ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 0,
DROP COLUMN IF EXISTS phase_1_start_time,
DROP COLUMN IF EXISTS phase_2_start_time,
DROP COLUMN IF EXISTS phase_3_start_time,
DROP COLUMN IF EXISTS phase_4_start_time,
DROP COLUMN IF EXISTS phase_5_start_time,
DROP COLUMN IF EXISTS phase_start_time;

-- Manter apenas: event_started, event_ended, event_start_time, event_end_time

-- PASSO 4: Criar tabela para rastrear histórico de quests ativas
-- ==========================================
CREATE TABLE IF NOT EXISTS quest_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'started', 'ended', 'auto_started', 'auto_ended'
  triggered_by UUID REFERENCES auth.users(id),
  triggered_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quest_activity_quest ON quest_activity_log(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_activity_triggered ON quest_activity_log(triggered_at);

-- PASSO 5: Criar função para calcular quest ativa baseado em timing
-- ==========================================
CREATE OR REPLACE FUNCTION get_active_quest_by_timing(phase_id_param UUID)
RETURNS UUID AS $$
DECLARE
  v_active_quest_id UUID;
BEGIN
  -- Encontrar a quest da fase que deve estar ativa baseado em timing
  SELECT q.id INTO v_active_quest_id
  FROM quests q
  WHERE q.phase_id = phase_id_param
    AND q.status IN ('active', 'scheduled')
    AND (
      -- Se a quest foi iniciada manualmente
      (q.started_at IS NOT NULL AND NOW() >= q.started_at AND (q.ended_at IS NULL OR NOW() < q.ended_at))
      OR
      -- Se auto-start está habilitado e o tempo chegou
      (q.auto_start_enabled AND q.started_at IS NULL AND NOW() >= (q.created_at + (q.auto_start_delay_minutes || ' minutes')::interval))
    )
  ORDER BY q.order_index ASC
  LIMIT 1;

  RETURN v_active_quest_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- PASSO 6: Criar função para iniciar uma quest
-- ==========================================
CREATE OR REPLACE FUNCTION start_quest(quest_id_param UUID, started_by_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE quests
  SET
    status = 'active',
    started_at = NOW(),
    started_by = started_by_user_id
  WHERE id = quest_id_param;

  INSERT INTO quest_activity_log (quest_id, action, triggered_by, notes)
  VALUES (quest_id_param, 'started', started_by_user_id, 'Manually started via admin panel');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- PASSO 7: Criar função para encerrar uma quest
-- ==========================================
CREATE OR REPLACE FUNCTION end_quest(quest_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE quests
  SET
    status = 'closed',
    ended_at = NOW()
  WHERE id = quest_id_param;

  INSERT INTO quest_activity_log (quest_id, action, notes)
  VALUES (quest_id_param, 'ended', 'Manually closed via admin panel');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- PASSO 8: Criar view para status de quests por fase
-- ==========================================
CREATE OR REPLACE VIEW quest_status_by_phase AS
SELECT
  p.id as phase_id,
  p.name as phase_name,
  p.duration_minutes as phase_duration,
  COUNT(DISTINCT q.id) as total_quests,
  COUNT(DISTINCT CASE WHEN q.status = 'active' THEN q.id END) as active_quests,
  COUNT(DISTINCT CASE WHEN q.status = 'scheduled' THEN q.id END) as scheduled_quests,
  COUNT(DISTINCT CASE WHEN q.status = 'closed' THEN q.id END) as closed_quests,
  MAX(q.started_at) as last_quest_started,
  MIN(q.ended_at) FILTER (WHERE q.ended_at IS NOT NULL) as first_quest_ended
FROM phases p
LEFT JOIN quests q ON p.id = q.phase_id
GROUP BY p.id, p.name, p.duration_minutes
ORDER BY p.order_index ASC;

-- PASSO 9: Atualizar RLS policies para quests
-- ==========================================
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "Todos podem ver quests" ON quests;
DROP POLICY IF EXISTS "Admin pode atualizar quests" ON quests;

-- SELECT: todos podem ver quests (todas as que não são secretas)
CREATE POLICY "Todos podem ver quests"
ON quests
FOR SELECT
TO authenticated
USING (status IN ('scheduled', 'active', 'closed', 'completed'));

-- UPDATE: apenas admin pode atualizar quests (controle de status)
CREATE POLICY "Admin pode atualizar quests"
ON quests
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true); -- Validação será feita no backend

-- PASSO 10: RLS para quest_activity_log
-- ==========================================
ALTER TABLE quest_activity_log ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "Todos podem ver atividade de quests" ON quest_activity_log;
DROP POLICY IF EXISTS "Sistema pode registrar atividade de quests" ON quest_activity_log;

-- SELECT: todos podem ver atividades
CREATE POLICY "Todos podem ver atividade de quests"
ON quest_activity_log
FOR SELECT
TO authenticated
USING (true);

-- INSERT: sistema pode registrar atividades
CREATE POLICY "Sistema pode registrar atividade de quests"
ON quest_activity_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- PASSO 11: Dados de inicialização (se necessário)
-- ==========================================
-- Atualizar event_config para remover campos antigos
UPDATE event_config
SET
  active_quest_id = NULL,
  event_started = FALSE,
  event_ended = FALSE
WHERE id = '00000000-0000-0000-0000-000000000001';

-- PASSO 12: Mensagem de sucesso
-- ==========================================
SELECT 'Quest Automation System instalado com sucesso!' as status;
