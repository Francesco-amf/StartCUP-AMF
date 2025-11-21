-- Verificar status atual de Quest 1.1
-- Copie e execute no Supabase SQL Editor

SELECT 'EVENT CONFIG' as "Section";
SELECT current_phase, event_started, updated_at FROM event_config LIMIT 1;

SELECT '';
SELECT 'PHASES' as "Section";
SELECT id, order_index FROM phases ORDER BY order_index LIMIT 5;

SELECT '';
SELECT 'PHASE 1 INFO' as "Section";
SELECT id, order_index FROM phases WHERE order_index = 1;

SELECT '';
SELECT 'QUESTS DE PHASE 1' as "Section";
SELECT 
  q.id,
  q.order_index,
  q.status,
  q.started_at,
  q.planned_deadline_minutes,
  CASE WHEN q.order_index = 4 THEN '🔴 BOSS' ELSE 'Regular' END as "Tipo"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;

SELECT '';
SELECT 'VERIFICAR BOSS' as "Section";
SELECT 
  q.order_index,
  q.status,
  q.started_at as "Started",
  CASE 
    WHEN q.started_at IS NOT NULL THEN '⚠️ ATIVADA'
    ELSE '✅ Não ativada'
  END as "Status Boss"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 4;

SELECT '';
SELECT 'QUEST 1.1 DETALHES' as "Section";
SELECT 
  q.order_index,
  q.status,
  q.started_at,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  NOW() as "Current Server Time"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 1;

SELECT '';
SELECT 'BOSS BATTLES' as "Section";
SELECT COUNT(*) as "Total", 
  CASE WHEN COUNT(*) = 0 THEN '✅ Limpo' ELSE '⚠️ Tem orphans' END as "Status"
FROM boss_battles;
