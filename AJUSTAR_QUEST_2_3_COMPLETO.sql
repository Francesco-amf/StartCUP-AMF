-- 🔧 AJUSTAR QUEST 2.3: DURAÇÃO 100MIN + GARANTIR SCHEDULED

UPDATE quests
SET 
  duration_minutes = 100,
  status = 'scheduled',
  started_at = NULL
WHERE id IN (
  SELECT q.id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 2 
    AND q.order_index = 3
)
RETURNING 
  order_index as "Quest",
  name as "Nome",
  duration_minutes as "Duração (min)",
  status as "Status",
  started_at as "Iniciou Em";

-- ✅ Quest 2.3: 100 minutos + status='scheduled' + started_at=NULL
