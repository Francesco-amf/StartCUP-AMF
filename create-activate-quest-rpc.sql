-- ============================================================================
-- CREATE RPC FUNCTION: Activate Quest (bypass Supabase Client bug)
-- ============================================================================
-- This function bypasses the "UPDATE requires WHERE clause" bug by using
-- raw SQL UPDATE instead of the Supabase JS client
-- ============================================================================

-- Drop function if exists
DROP FUNCTION IF EXISTS activate_quest(uuid);
DROP FUNCTION IF EXISTS close_quest(uuid);

-- Function to CLOSE a quest
CREATE OR REPLACE FUNCTION close_quest(p_quest_id uuid)
RETURNS TABLE (
  id uuid,
  name varchar(200),
  status varchar(50),
  ended_at timestamp,
  phase_id integer,
  order_index integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update the quest to closed
  UPDATE public.quests
  SET 
    status = 'closed',
    ended_at = NOW()::timestamp
  WHERE public.quests.id = p_quest_id;
  
  -- Return the updated quest
  RETURN QUERY
  SELECT 
    q.id,
    q.name,
    q.status,
    q.ended_at::timestamp,
    q.phase_id,
    q.order_index
  FROM public.quests q
  WHERE q.id = p_quest_id;
END;
$$;

-- Function to ACTIVATE a quest
CREATE OR REPLACE FUNCTION activate_quest(p_quest_id uuid)
RETURNS TABLE (
  id uuid,
  name varchar(200),
  status varchar(50),
  started_at timestamp,
  phase_id integer,
  order_index integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Disable RLS for this function (SECURITY DEFINER gives us this power)
  -- Update the quest to active with started_at
  UPDATE public.quests
  SET 
    status = 'active',
    started_at = NOW()::timestamp
  WHERE public.quests.id = p_quest_id;
  
  -- Return the updated quest
  RETURN QUERY
  SELECT 
    q.id,
    q.name,
    q.status,
    q.started_at::timestamp,
    q.phase_id,
    q.order_index
  FROM public.quests q
  WHERE q.id = p_quest_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION close_quest(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION activate_quest(uuid) TO authenticated, anon, service_role;

-- Test the functions
SELECT 'Testing RPC functions' as step;

-- Get Quest 5.3 ID
DO $$
DECLARE
  v_quest_id uuid;
BEGIN
  SELECT id INTO v_quest_id FROM quests WHERE phase_id = 5 AND order_index = 3;
  
  -- Test activate
  RAISE NOTICE 'Testing activate_quest...';
  PERFORM * FROM activate_quest(v_quest_id);
  
  -- Test close
  RAISE NOTICE 'Testing close_quest...';
  PERFORM * FROM close_quest(v_quest_id);
  
  -- Reset to scheduled
  UPDATE quests SET status = 'scheduled', started_at = NULL, ended_at = NULL WHERE id = v_quest_id;
END $$;

SELECT 'RPC functions created successfully!' as status;
SELECT 'Use: SELECT * FROM activate_quest(''quest-id-here'')' as usage;
