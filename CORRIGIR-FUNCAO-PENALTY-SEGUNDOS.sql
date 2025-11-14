-- ==========================================
-- CORRIGIR: Usar SEGUNDOS em vez de MINUTOS
-- ==========================================
-- O problema: qualquer atraso < 1 minuto vira 0 segundos
-- Solução: converter para segundos na função

-- PASSO 1: Recriar função para aceitar SEGUNDOS
DROP FUNCTION IF EXISTS calculate_late_penalty(INTEGER);

CREATE OR REPLACE FUNCTION calculate_late_penalty(
  late_seconds_param INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_minutes INTEGER;
  v_penalty INTEGER;
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
    -- Mais de 15 minutos: rejeitar
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASSO 2: Atualizar TRIGGER para passar SEGUNDOS
DROP TRIGGER IF EXISTS update_late_submission_fields_trigger ON submissions;

CREATE OR REPLACE FUNCTION update_late_submission_fields()
RETURNS TRIGGER AS $$
DECLARE
  v_deadline TIMESTAMP;
  v_seconds_late INTEGER;
  v_minutes_late INTEGER;
BEGIN
  v_deadline := calculate_quest_deadline(NEW.quest_id);
  NEW.quest_deadline := v_deadline;

  -- Se deadline foi calculado e está no passado, marcar como atrasada
  IF v_deadline IS NOT NULL AND NEW.submitted_at > v_deadline THEN
    NEW.is_late := TRUE;
    -- Calcular em SEGUNDOS (não minutos!)
    v_seconds_late := EXTRACT(EPOCH FROM (NEW.submitted_at - v_deadline))::INTEGER;
    -- Também guardar em minutos para referência
    v_minutes_late := CEIL(v_seconds_late::DECIMAL / 60)::INTEGER;
    NEW.late_minutes := v_minutes_late;
    -- Passar SEGUNDOS para a função de penalty
    NEW.late_penalty_applied := calculate_late_penalty(v_seconds_late);
  ELSE
    NEW.is_late := FALSE;
    NEW.late_minutes := 0;
    NEW.late_penalty_applied := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
CREATE TRIGGER update_late_submission_fields_trigger
BEFORE INSERT OR UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_late_submission_fields();

-- PASSO 3: Testar a função
-- Testes:
-- 10 segundos → 1 minuto → penalty = 5 ✅
-- 30 segundos → 1 minuto → penalty = 5 ✅
-- 60 segundos → 1 minuto → penalty = 5 ✅
-- 5*60 = 300 segundos → 5 minutos → penalty = 5 ✅
-- 6*60 = 360 segundos → 6 minutos → penalty = 10 ✅
-- 11*60 = 660 segundos → 11 minutos → penalty = 15 ✅

SELECT
  'TESTE 10 segundos' as teste,
  calculate_late_penalty(10) as penalty
UNION ALL
SELECT '30 segundos', calculate_late_penalty(30)
UNION ALL
SELECT '60 segundos', calculate_late_penalty(60)
UNION ALL
SELECT '300 segundos (5 min)', calculate_late_penalty(300)
UNION ALL
SELECT '360 segundos (6 min)', calculate_late_penalty(360)
UNION ALL
SELECT '660 segundos (11 min)', calculate_late_penalty(660);

-- PASSO 4: Recalcular submissões existentes
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
AND s.late_penalty_applied = 0;

-- Verificar resultado
SELECT
  'APÓS CORRIGIR' as etapa,
  s.id,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  s.final_points,
  s.status,
  t.name as team_name
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE s.is_late = TRUE
ORDER BY s.submitted_at DESC
LIMIT 10;
