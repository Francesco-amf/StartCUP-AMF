-- ==========================================
-- DIAGNOSTIC: Check event_config after reset
-- ==========================================

-- QUERY 1: Current event config state
SELECT
  id,
  current_phase,
  event_started,
  event_ended,
  event_start_time,
  event_end_time,
  phase_1_start_time,
  phase_2_start_time,
  phase_3_start_time,
  phase_4_start_time,
  phase_5_start_time,
  created_at,
  updated_at
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- QUERY 2: Show only the relevant columns with readable format
SELECT
  current_phase,
  event_started,
  CASE
    WHEN phase_1_start_time IS NULL THEN '❌ NULL'
    ELSE '✅ ' || phase_1_start_time::text
  END as phase_1_status,
  CASE
    WHEN phase_2_start_time IS NULL THEN '❌ NULL'
    ELSE '✅ ' || phase_2_start_time::text
  END as phase_2_status
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- QUERY 3: Check if phase_1 quests have started_at
SELECT
  q.id,
  q.name,
  q.order_index,
  q.status,
  CASE
    WHEN q.started_at IS NULL THEN '❌ NULL'
    ELSE '✅ ' || q.started_at::text
  END as started_at_status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;

-- QUERY 4: Show calculated phase time information
SELECT
  'Phase 1' as phase,
  current_phase,
  phase_1_start_time,
  -- Calculate what the end time SHOULD be (start + 150 minutes for Phase 1)
  CASE
    WHEN phase_1_start_time IS NOT NULL THEN
      phase_1_start_time + interval '150 minutes'
    ELSE NULL
  END as calculated_end_time,
  NOW() as current_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
