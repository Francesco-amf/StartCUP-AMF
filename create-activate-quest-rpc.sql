-- ============================================================================
-- CREATE RPC FUNCTION: Manual Quest Activation (bypass started_at bug)
-- ============================================================================
-- This function bypasses the "UPDATE requires WHERE clause" bug by using
-- raw SQL UPDATE instead of the Supabase client
-- ============================================================================

-- Drop function if exists
DROP FUNCTION IF EXISTS activate_quest_manual(uuid, timestamptz);

-- Create function to manually activate a quest
CREATE OR REPLACE FUNCTION activate_quest_manual(
  p_quest_id uuid,
  p_started_at timestamptz DEFAULT NOW()
)
RETURNS TABLE (
  id uuid,
  name text,
  status text,
  started_at timestamptz,
  phase_id integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the quest status and started_at in one atomic operation
  UPDATE quests
  SET 
    status = 'active',
    started_at = p_started_at
  WHERE quests.id = p_quest_id;
  
  -- Return the updated quest
  RETURN QUERY
  SELECT 
    q.id,
    q.name,
    q.status,
    q.started_at,
    q.phase_id
  FROM quests q
  WHERE q.id = p_quest_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION activate_quest_manual(uuid, timestamptz) TO authenticated;

-- Test the function
SELECT 'Testing activate_quest_manual function' as step;
SELECT * FROM activate_quest_manual(
  (SELECT id FROM quests WHERE phase_id = 5 AND order_index = 3),
  NOW()
);

-- Revert test (set back to scheduled)
UPDATE quests
SET status = 'scheduled', started_at = NULL
WHERE phase_id = 5 AND order_index = 3;

SELECT 'Function created successfully!' as status;
