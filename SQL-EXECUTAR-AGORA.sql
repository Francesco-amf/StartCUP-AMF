-- ========================================
-- EXECUTAR ISTO AGORA NO SUPABASE
-- ========================================
-- Este SQL vai corrigir tudo automaticamente
-- ========================================

-- Configurar deadlines nas quests
UPDATE quests
SET
  started_at = COALESCE(started_at, NOW() - INTERVAL '120 minutes'),
  planned_deadline_minutes = CASE WHEN planned_deadline_minutes = 0 THEN 30 ELSE planned_deadline_minutes END,
  late_submission_window_minutes = COALESCE(late_submission_window_minutes, 15),
  allow_late_submissions = TRUE
WHERE id IN (SELECT DISTINCT s.quest_id FROM submissions s WHERE s.is_late = TRUE)
AND (started_at IS NULL OR planned_deadline_minutes = 0 OR allow_late_submissions IS FALSE);

-- Recalcular penalidades nas submissions
UPDATE submissions s
SET
  is_late = TRUE,
  late_minutes = EXTRACT(EPOCH FROM (s.submitted_at - (
    SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
    FROM quests q WHERE q.id = s.quest_id
  )))::INTEGER / 60,
  late_penalty_applied = calculate_late_penalty(
    EXTRACT(EPOCH FROM (s.submitted_at - (
      SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
      FROM quests q WHERE q.id = s.quest_id
    )))::INTEGER / 60
  )
WHERE s.submitted_at > (
  SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
  FROM quests q WHERE q.id = s.quest_id
)
AND s.is_late = FALSE;

-- Criar penalidades
INSERT INTO penalties (team_id, penalty_type, points_deduction, reason, assigned_by_admin)
SELECT
  s.team_id, 'atraso', s.late_penalty_applied,
  'Submissão atrasada por ' || s.late_minutes || ' minuto(s)', TRUE
FROM submissions s
WHERE s.is_late = TRUE
  AND s.late_penalty_applied > 0
  AND s.team_id NOT IN (SELECT DISTINCT team_id FROM penalties WHERE penalty_type = 'atraso')
ON CONFLICT DO NOTHING;

-- Ver resultado
SELECT
  'PRONTO!' as resultado,
  (SELECT COUNT(*) FROM submissions WHERE is_late = TRUE AND late_penalty_applied > 0) as submissions_atrasadas,
  (SELECT COUNT(*) FROM penalties WHERE penalty_type = 'atraso') as penalidades_criadas,
  (SELECT COUNT(DISTINCT team_id) FROM penalties WHERE penalty_type = 'atraso') as times_penalizados;
