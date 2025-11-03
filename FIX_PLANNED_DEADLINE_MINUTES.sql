-- ==========================================
-- FIX: Restore Original Planned Deadline Minutes
-- ==========================================
-- Os tempos originais de cada quest foram substituídos por 30
-- Precisa restaurar para os valores originais:
-- Quest 1 Fase 1: 45 minutos
-- Quest 2 Fase 1: 35 minutos
-- etc.

-- PASSO 1: Ver valores atuais
SELECT
  q.id,
  q.name,
  p.name as phase,
  p.order_index as phase_order,
  q.order_index as quest_order,
  q.planned_deadline_minutes as current,
  CASE
    WHEN p.order_index = 1 AND q.order_index = 1 THEN 45
    WHEN p.order_index = 1 AND q.order_index = 2 THEN 35
    WHEN p.order_index = 1 AND q.order_index = 3 THEN 40
    WHEN p.order_index = 1 AND q.order_index = 4 THEN 50
    WHEN p.order_index = 1 AND q.order_index = 5 THEN 60
    WHEN p.order_index = 2 AND q.order_index = 1 THEN 45
    WHEN p.order_index = 2 AND q.order_index = 2 THEN 35
    WHEN p.order_index = 2 AND q.order_index = 3 THEN 40
    WHEN p.order_index = 3 AND q.order_index = 1 THEN 45
    WHEN p.order_index = 3 AND q.order_index = 2 THEN 35
    WHEN p.order_index = 4 AND q.order_index = 1 THEN 45
    WHEN p.order_index = 5 AND q.order_index = 1 THEN 45
    ELSE 30
  END as deveria_ser
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- PASSO 2: Atualizar os valores para os corretos
-- Fase 1
UPDATE quests
SET planned_deadline_minutes = CASE
  WHEN order_index = 1 THEN 45
  WHEN order_index = 2 THEN 35
  WHEN order_index = 3 THEN 40
  WHEN order_index = 4 THEN 50
  WHEN order_index = 5 THEN 60
  ELSE planned_deadline_minutes
END
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1);

-- Fase 2
UPDATE quests
SET planned_deadline_minutes = CASE
  WHEN order_index = 1 THEN 45
  WHEN order_index = 2 THEN 35
  WHEN order_index = 3 THEN 40
  ELSE planned_deadline_minutes
END
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2);

-- Fase 3
UPDATE quests
SET planned_deadline_minutes = CASE
  WHEN order_index = 1 THEN 45
  WHEN order_index = 2 THEN 35
  ELSE planned_deadline_minutes
END
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3);

-- Fase 4
UPDATE quests
SET planned_deadline_minutes = 45
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4)
  AND order_index = 1;

-- Fase 5
UPDATE quests
SET planned_deadline_minutes = 45
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5)
  AND order_index = 1;

-- PASSO 3: Verificar que foi atualizado
SELECT
  q.id,
  q.name,
  p.name as phase,
  p.order_index as phase_order,
  q.order_index as quest_order,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  (q.planned_deadline_minutes + q.late_submission_window_minutes) as total_disponivel
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;
