-- ============================================================================
-- RESET QUEST 1.2 - Voltar para início
-- ============================================================================

-- PASSO 1: Buscar o ID da Quest 1.2
WITH quest_1_2 AS (
  SELECT id, name, order_index
  FROM quests
  WHERE order_index = 2
  AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1)
  LIMIT 1
)
SELECT * FROM quest_1_2;

-- PASSO 2: Resetar a quest 1.2
UPDATE quests
SET 
  status = 'active',
  started_at = NOW() AT TIME ZONE 'UTC',
  ended_at = NULL,
  started_by = NULL
WHERE order_index = 2
AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1);


-- PASSO 4: Verificar resultado
SELECT 
  q.id,
  q.name,
  q.order_index,
  q.status,
  q.started_at,
  COUNT(s.id) as total_submissions
FROM quests q
LEFT JOIN submissions s ON q.id = s.quest_id
WHERE q.order_index = 2
AND q.phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1)
GROUP BY q.id, q.name, q.order_index, q.status, q.started_at;
