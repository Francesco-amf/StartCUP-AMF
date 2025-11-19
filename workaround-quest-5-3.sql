-- ============================================================================
-- WORKAROUND: Fix Quest 5.2 -> 5.3 transition by using raw SQL
-- ============================================================================
-- Problem: UPDATE with started_at fails with "UPDATE requires a WHERE clause"
-- Root cause: Unknown trigger/policy issue with started_at column
-- Workaround: Use raw SQL update in the advance-quest endpoint
-- ============================================================================

-- Test 1: Verify current state
SELECT 'Current State' as step;
SELECT
  q.id,
  q.order_index,
  q.name,
  q.status,
  q.started_at,
  q.phase_id
FROM quests q
WHERE q.phase_id = 5
ORDER BY q.order_index;

-- Test 2: Try UPDATE with raw SQL (this should work)
SELECT 'Test UPDATE with raw SQL' as step;

-- Close Quest 5.2
UPDATE quests
SET status = 'closed', ended_at = NOW()
WHERE id = 'ada6400b-c1f6-4f48-9518-ac383cb68a6b';

-- Activate Quest 5.3 WITHOUT started_at first
UPDATE quests
SET status = 'active'
WHERE phase_id = 5 AND order_index = 3;

-- Then update started_at separately
UPDATE quests
SET started_at = NOW()
WHERE phase_id = 5 AND order_index = 3 AND status = 'active';

SELECT 'Verify Update' as step;
SELECT
  q.id,
  q.order_index,
  q.name,
  q.status,
  q.started_at
FROM quests q
WHERE q.phase_id = 5
ORDER BY q.order_index;
