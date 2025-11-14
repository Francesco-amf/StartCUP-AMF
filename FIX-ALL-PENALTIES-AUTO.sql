-- ========================================
-- FIX AUTOMÁTICO: Configurar Deadlines e Recalcular Penalidades
-- ========================================
-- Este script:
-- 1. Encontra quests que estão configuradas errado
-- 2. Configura deadlines corretos
-- 3. Recalcula penalidades para submissões atrasadas
-- 4. Insere penalidades na tabela penalties
-- ========================================

-- PASSO 1: Diagnosticar o problema
-- ========================================
DO $$
DECLARE
  v_missing_deadlines INT;
  v_late_submissions_no_penalties INT;
  v_penalties_count INT;
BEGIN
  -- Contar quests sem deadline
  SELECT COUNT(*)
  INTO v_missing_deadlines
  FROM quests
  WHERE started_at IS NULL OR planned_deadline_minutes = 0 OR allow_late_submissions IS FALSE;

  -- Contar submissões atrasadas sem penalidade
  SELECT COUNT(*)
  INTO v_late_submissions_no_penalties
  FROM submissions
  WHERE is_late = TRUE AND late_penalty_applied = 0;

  -- Contar penalidades existentes
  SELECT COUNT(*)
  INTO v_penalties_count
  FROM penalties
  WHERE penalty_type = 'atraso';

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║             DIAGNÓSTICO DE PENALIDADES                          ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE 'Quests sem deadline configurado: %', v_missing_deadlines;
  RAISE NOTICE 'Submissões atrasadas sem penalty: %', v_late_submissions_no_penalties;
  RAISE NOTICE 'Penalidades criadas: %', v_penalties_count;
  RAISE NOTICE '';
END $$;

-- PASSO 2: Encontrar quests que precisam de configuração
-- ========================================
WITH problem_quests AS (
  SELECT
    q.id,
    q.name,
    q.started_at,
    q.planned_deadline_minutes,
    COUNT(DISTINCT s.id) as submission_count
  FROM quests q
  LEFT JOIN submissions s ON q.id = s.quest_id
  WHERE q.id IN (
    SELECT DISTINCT s.quest_id
    FROM submissions s
    WHERE s.is_late = TRUE
  )
    AND (q.started_at IS NULL OR q.planned_deadline_minutes = 0 OR q.allow_late_submissions IS FALSE)
  GROUP BY q.id, q.name, q.started_at, q.planned_deadline_minutes
)
SELECT
  'QUESTS AFETADAS' as check_type,
  id,
  name,
  started_at,
  planned_deadline_minutes,
  submission_count
FROM problem_quests;

-- PASSO 3: Configurar deadlines para quests que não têm
-- ========================================
UPDATE quests
SET
  started_at = COALESCE(started_at, NOW() - INTERVAL '120 minutes'),
  planned_deadline_minutes = CASE
    WHEN planned_deadline_minutes = 0 THEN 30
    ELSE planned_deadline_minutes
  END,
  late_submission_window_minutes = COALESCE(late_submission_window_minutes, 15),
  allow_late_submissions = TRUE
WHERE id IN (
  SELECT DISTINCT s.quest_id
  FROM submissions s
  WHERE s.is_late = TRUE
)
AND (started_at IS NULL OR planned_deadline_minutes = 0 OR allow_late_submissions IS FALSE);

-- PASSO 4: Atualizar is_late e late_penalty_applied nas submissions
-- ========================================
UPDATE submissions s
SET
  is_late = TRUE,
  late_minutes = EXTRACT(EPOCH FROM (s.submitted_at - (
    SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
    FROM quests q
    WHERE q.id = s.quest_id
  )))::INTEGER / 60,
  late_penalty_applied = calculate_late_penalty(
    EXTRACT(EPOCH FROM (s.submitted_at - (
      SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
      FROM quests q
      WHERE q.id = s.quest_id
    )))::INTEGER / 60
  )
WHERE s.submitted_at > (
  SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
  FROM quests q
  WHERE q.id = s.quest_id
)
AND s.is_late = FALSE;

-- PASSO 5: Criar penalidades para submissões atrasadas
-- ========================================
INSERT INTO penalties (team_id, penalty_type, points_deduction, reason, assigned_by_admin)
SELECT
  s.team_id,
  'atraso',
  s.late_penalty_applied,
  'Submissão atrasada por ' || s.late_minutes || ' minuto(s)',
  TRUE
FROM submissions s
WHERE s.is_late = TRUE
  AND s.late_penalty_applied > 0
  AND s.team_id NOT IN (
    SELECT DISTINCT team_id FROM penalties WHERE penalty_type = 'atraso'
  )
ON CONFLICT DO NOTHING;

-- PASSO 6: Verificar o resultado
-- ========================================
SELECT
  'RESULTADO FINAL' as status,
  (SELECT COUNT(*) FROM submissions WHERE is_late = TRUE AND late_penalty_applied > 0) as subs_com_penalty,
  (SELECT COUNT(*) FROM penalties WHERE penalty_type = 'atraso') as penalties_criadas,
  (SELECT COUNT(DISTINCT team_id) FROM penalties WHERE penalty_type = 'atraso') as teams_com_penalty;
