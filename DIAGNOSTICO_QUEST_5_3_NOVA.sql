-- Verificar a Quest 5.3 recriada
SELECT
  'Quest 5.3 Details' as section,
  q.id,
  q.order_index,
  q.name,
  q.status,
  q.started_at,
  q.ended_at,
  q.duration_minutes,
  q.max_points,
  p.id as phase_id,
  p.order_index as phase_order
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 3 AND p.order_index = 5;

-- Testar UPDATE manual
WITH quest_5_3 AS (
  SELECT id FROM quests
  WHERE order_index = 3
    AND phase_id = (SELECT id FROM phases WHERE order_index = 5)
  LIMIT 1
)
UPDATE quests
SET status = 'active', started_at = '2025-11-11T15:00:00'
WHERE id = (SELECT id FROM quest_5_3)
RETURNING id, name, status, started_at;
