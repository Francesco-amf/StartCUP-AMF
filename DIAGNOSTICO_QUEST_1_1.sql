-- ============================================================================
-- DIAGNOSTICO_QUEST_1_1.sql
-- ============================================================================
-- Ver exatamente qual é o ID e started_at da Quest 1.1
-- ============================================================================

SELECT '=== DIAGNÓSTICO QUEST 1.1 ===' as diagnostico;

SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.id as quest_id,
  q.name,
  q.status,
  q.started_at,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  ROUND(EXTRACT(EPOCH FROM (
    q.started_at + INTERVAL '45 minutes' - NOW()
  )) / 60) as minutos_restantes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 1;

SELECT '' as espacador;

SELECT '=== TODAS AS QUESTS FASE 1 ===' as todas_quests;

SELECT 
  q.order_index as quest,
  q.name,
  q.status,
  ROUND(EXTRACT(EPOCH FROM (
    q.started_at + 
    (q.planned_deadline_minutes * INTERVAL '1 minute') + 
    (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute') - 
    NOW()
  )) / 60) as minutos_restantes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;
