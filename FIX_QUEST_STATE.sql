-- ==========================================
-- FIX: Ensure Only Quest 1 is Active
-- ==========================================
-- After reset, both quests might still be active
-- This will fix it manually

-- First, check current state
SELECT
  q.id,
  q.name,
  q.status,
  q.order_index
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;

-- ==========================================
-- FIX: Set Quest 1 to active, rest to scheduled
-- ==========================================
-- This ensures the logic works correctly

-- Step 1: Find Phase 1 ID
WITH phase_1 AS (
  SELECT id FROM phases WHERE order_index = 1
)
-- Step 2: Update Quest 1 (should already be active with correct started_at from reactivation)
UPDATE quests
SET status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 1;

-- Step 3: Set all other quests in Phase 1 to scheduled
UPDATE quests
SET status = 'scheduled', started_at = NULL
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index > 1;

-- Verify the fix
SELECT
  q.id,
  q.name,
  q.status,
  q.started_at,
  q.order_index
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;
