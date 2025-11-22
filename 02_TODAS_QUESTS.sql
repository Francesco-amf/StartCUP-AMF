-- SCRIPT 2️⃣: TODAS AS QUESTS COM DETALHES
SELECT 
  p.order_index as "F",
  q.order_index as "Q",
  q.name,
  q.duration_minutes as "Dur",
  COALESCE(q.late_submission_window_minutes, 0) as "Late",
  CASE WHEN q.deliverable_type ILIKE '%presentation%' THEN 'BOSS' ELSE 'Normal' END as "Tipo"
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;
