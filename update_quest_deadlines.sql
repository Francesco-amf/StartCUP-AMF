-- ==========================================
-- UPDATE: Quest Planned Deadline Minutes
-- ==========================================

-- FASE 1: Descoberta
UPDATE quests
SET planned_deadline_minutes = CASE
  WHEN order_index = 1 THEN 60
  WHEN order_index = 2 THEN 50
  WHEN order_index = 3 THEN 30
  ELSE planned_deadline_minutes
END,
late_submission_window_minutes = 15
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1);

-- FASE 2: Criação
UPDATE quests
SET planned_deadline_minutes = CASE
  WHEN order_index = 1 THEN 50
  WHEN order_index = 2 THEN 30
  WHEN order_index = 3 THEN 120
  ELSE planned_deadline_minutes
END,
late_submission_window_minutes = 15
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2);

-- FASE 3: Estratégia
UPDATE quests
SET planned_deadline_minutes = CASE
  WHEN order_index = 1 THEN 40
  WHEN order_index = 2 THEN 30
  WHEN order_index = 3 THEN 70
  ELSE planned_deadline_minutes
END,
late_submission_window_minutes = 15
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3);

-- FASE 4: Refinamento
UPDATE quests
SET planned_deadline_minutes = CASE
  WHEN order_index = 1 THEN 40
  WHEN order_index = 2 THEN 40
  WHEN order_index = 3 THEN 30
  ELSE planned_deadline_minutes
END,
late_submission_window_minutes = 15
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4);

-- FASE 5: O Pitch
UPDATE quests
SET planned_deadline_minutes = CASE
  WHEN order_index = 1 THEN 20
  WHEN order_index = 2 THEN 40
  WHEN order_index = 3 THEN 30
  ELSE planned_deadline_minutes
END,
late_submission_window_minutes = 15
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5);
