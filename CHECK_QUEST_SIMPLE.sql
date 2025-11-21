-- Verificar status de Quest 1.1 - UMA ÚNICA QUERY
-- Copie e execute no Supabase SQL Editor

WITH event_info AS (
  SELECT current_phase, event_started FROM event_config LIMIT 1
),
phase1_id AS (
  SELECT id FROM phases WHERE order_index = 1
),
quests_phase1 AS (
  SELECT 
    q.order_index,
    q.status,
    q.started_at,
    q.planned_deadline_minutes,
    q.late_submission_window_minutes,
    CASE WHEN q.order_index = 4 THEN '🔴 BOSS' ELSE 'Regular' END as tipo
  FROM quests q, phase1_id p
  WHERE q.phase_id = p.id
)
SELECT 
  '🎯 EVENTO' as categoria,
  'Phase: ' || (SELECT current_phase FROM event_info)::text as info
UNION ALL
SELECT 
  '🎯 EVENTO',
  'Started: ' || (SELECT event_started FROM event_info)::text
UNION ALL
SELECT 
  '📊 QUESTS FASE 1',
  'Order ' || order_index::text || ' - ' || status || ' (' || tipo || ')'
FROM quests_phase1
ORDER BY 1, 2;
