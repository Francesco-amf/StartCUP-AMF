-- 🔍 VERIFICAR DURAÇÃO ATUAL DO BOSS 2.4

SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.duration_minutes as "Duração (min)",
  q.status as "Status",
  q.started_at as "Iniciou Em"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 
  AND q.order_index = 4;
