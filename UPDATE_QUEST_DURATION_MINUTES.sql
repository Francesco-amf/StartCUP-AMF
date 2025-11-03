-- ==========================================
-- UPDATE: Quest Duration Minutes
-- ==========================================
-- Based on StartCup AMF official document
-- Updates the duration_minutes for each quest to match the specifications
--
-- Timeline:
-- Fase 1 (20h-22h30): 150 min total - Quests: 60, 50, 30 min
-- Fase 2 (22h30-01h30): 210 min total - Quests: 50, 30, 120 min
-- Fase 3 (01h30-04h00): 150 min total - Quests: 40, 30, 70 min (+ 10 min boss)
-- Fase 4 (04h00-06h00): 120 min total - Quests: 40, 40, 30 min (+ 10 min boss)
-- Fase 5 (06h00-07h30): 90 min total - Quests: 20, 40, 30 min

-- FASE 1: Descoberta (150 min total)
UPDATE quests
SET duration_minutes = CASE
  WHEN order_index = 1 THEN 60    -- Quest 1.1: Conhecendo o Terreno
  WHEN order_index = 2 THEN 50    -- Quest 1.2: A Persona Secreta
  WHEN order_index = 3 THEN 30    -- Quest 1.3: Construindo Pontes
  ELSE duration_minutes
END
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1);

-- FASE 2: Criação (210 min total)
UPDATE quests
SET duration_minutes = CASE
  WHEN order_index = 1 THEN 50    -- Quest 2.1: A Grande Ideia
  WHEN order_index = 2 THEN 30    -- Quest 2.2: Identidade Secreta
  WHEN order_index = 3 THEN 120   -- Quest 2.3: Prova de Conceito
  ELSE duration_minutes
END
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2);

-- FASE 3: Estratégia (150 min total)
UPDATE quests
SET duration_minutes = CASE
  WHEN order_index = 1 THEN 40    -- Quest 3.1: Montando o Exército
  WHEN order_index = 2 THEN 30    -- Quest 3.2: Aliados Estratégicos
  WHEN order_index = 3 THEN 70    -- Quest 3.3: Show Me The Money
  ELSE duration_minutes
END
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3);

-- FASE 4: Refinamento (120 min total)
UPDATE quests
SET duration_minutes = CASE
  WHEN order_index = 1 THEN 40    -- Quest 4.1: Teste de Fogo
  WHEN order_index = 2 THEN 40    -- Quest 4.2: Validação de Mercado
  WHEN order_index = 3 THEN 30    -- Quest 4.3: Números que Convencem
  ELSE duration_minutes
END
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4);

-- FASE 5: O Pitch (90 min total)
UPDATE quests
SET duration_minutes = CASE
  WHEN order_index = 1 THEN 20    -- Quest 5.1: A História Épica
  WHEN order_index = 2 THEN 40    -- Quest 5.2: Slides de Impacto
  WHEN order_index = 3 THEN 30    -- Quest 5.3: Ensaio Geral
  ELSE duration_minutes
END
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Verify Fase 1
SELECT
  'Fase 1' as fase,
  q.order_index,
  q.name,
  q.duration_minutes,
  SUM(q.duration_minutes) OVER (PARTITION BY p.order_index) as total_fase
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;

-- Verify Fase 2
SELECT
  'Fase 2' as fase,
  q.order_index,
  q.name,
  q.duration_minutes,
  SUM(q.duration_minutes) OVER (PARTITION BY p.order_index) as total_fase
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- Verify Fase 3
SELECT
  'Fase 3' as fase,
  q.order_index,
  q.name,
  q.duration_minutes,
  SUM(q.duration_minutes) OVER (PARTITION BY p.order_index) as total_fase
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 3
ORDER BY q.order_index;

-- Verify Fase 4
SELECT
  'Fase 4' as fase,
  q.order_index,
  q.name,
  q.duration_minutes,
  SUM(q.duration_minutes) OVER (PARTITION BY p.order_index) as total_fase
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 4
ORDER BY q.order_index;

-- Verify Fase 5
SELECT
  'Fase 5' as fase,
  q.order_index,
  q.name,
  q.duration_minutes,
  SUM(q.duration_minutes) OVER (PARTITION BY p.order_index) as total_fase
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
ORDER BY q.order_index;

-- Summary of all phases with totals
SELECT
  p.order_index as fase,
  p.name as fase_name,
  q.order_index,
  q.name as quest_name,
  q.duration_minutes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index >= 1 AND p.order_index <= 5
ORDER BY p.order_index, q.order_index;
