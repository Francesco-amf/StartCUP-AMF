-- ==========================================
-- CHECK: Planned Deadline Minutes (Should be 45, not 30)
-- ==========================================

-- QUERY 1: Ver os valores de planned_deadline_minutes de todas as quests
SELECT
  q.id,
  q.name,
  p.name as phase,
  p.order_index as phase_order,
  q.order_index as quest_order,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  (q.planned_deadline_minutes + q.late_submission_window_minutes) as total_minutes_available
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- QUERY 2: Ver especificamente Quest 1 e 2 da Fase 1
SELECT
  q.id,
  q.name,
  q.status,
  q.started_at,
  q.planned_deadline_minutes as "Deveria ser",
  q.late_submission_window_minutes,
  (q.planned_deadline_minutes + q.late_submission_window_minutes) as total_disponivel
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;

-- QUERY 3: Se planned_deadline_minutes estão errados, corrigir para valores originais
-- Quest 1 Fase 1: 45 minutos
-- Quest 2 Fase 1: 35 minutos
-- etc.

-- Primeiro, vamos ver quais são os valores atuais
SELECT
  q.order_index,
  q.name,
  q.planned_deadline_minutes as atual,
  CASE
    WHEN q.order_index = 1 THEN 45
    WHEN q.order_index = 2 THEN 35
    WHEN q.order_index = 3 THEN 40
    WHEN q.order_index = 4 THEN 50
    WHEN q.order_index = 5 THEN 60
    ELSE 30
  END as deveria_ser
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;
