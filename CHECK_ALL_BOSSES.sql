-- Verificar se proteção de boss vai funcionar em TODAS as phases
-- Execute no Supabase SQL Editor

WITH all_bosses AS (
  SELECT 
    p.order_index as phase,
    q.order_index as quest_order,
    q.planned_deadline_minutes as duration,
    COALESCE(q.late_submission_window_minutes, 0) as late_window,
    (q.planned_deadline_minutes + COALESCE(q.late_submission_window_minutes, 0)) as total_duration,
    q.deliverable_type,
    CASE WHEN q.order_index = 4 THEN '🔴 BOSS' ELSE 'Regular' END as tipo
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE q.order_index = 4  -- Apenas bosses
)
SELECT 
  'PHASE ' || phase::text as section,
  'Boss' as item,
  'Duration: ' || duration::text || ' min + ' || late_window::text || ' late window = ' || total_duration::text || ' min total' as info,
  deliverable_type,
  tipo
FROM all_bosses
ORDER BY phase;
