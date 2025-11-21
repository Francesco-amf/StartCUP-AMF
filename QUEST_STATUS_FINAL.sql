-- Quest 1.1 Status Check - SIMPLES
-- Execute no Supabase SQL Editor

WITH quest_data AS (
  SELECT 
    q.order_index,
    q.status,
    q.started_at,
    CASE WHEN q.order_index = 4 THEN '🔴 BOSS' ELSE 'Regular' END as tipo
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1
)
SELECT 
  'PHASE' as section,
  'Phase ' || ec.current_phase || ' | Started: ' || ec.event_started as info
FROM event_config ec

UNION ALL

SELECT 
  'QUEST ' || order_index::text,
  status || ' | Started: ' || COALESCE(started_at::text, 'NÃO') || ' (' || tipo || ')'
FROM quest_data
ORDER BY section;
