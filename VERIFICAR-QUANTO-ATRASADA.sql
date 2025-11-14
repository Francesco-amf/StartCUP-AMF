-- ==========================================
-- VERIFICAR QUANTO FOI ATRASADA
-- ==========================================

SELECT
  s.id,
  s.submitted_at,
  q.started_at,
  q.planned_deadline_minutes,
  (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL) as deadline,
  -- Calcular minutos atrasados
  EXTRACT(EPOCH FROM (s.submitted_at - (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL)))::INTEGER / 60 as minutos_atrasados,
  s.is_late,
  s.late_penalty_applied,
  s.final_points,
  t.name as team_name
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
LEFT JOIN teams t ON s.team_id = t.id
WHERE s.id = '503f9b1d-28ba-4167-a2f7-0d806eafc2b3';
