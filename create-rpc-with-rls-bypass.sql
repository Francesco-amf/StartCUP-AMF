-- ============================================================================
-- ALTERNATIVE: RPC Functions that DISABLE RLS during execution
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS activate_quest(uuid);
DROP FUNCTION IF EXISTS close_quest(uuid);

-- Function to ACTIVATE a quest (WITH RLS BYPASS)
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
DECLARE
  v_old_rls boolean;
BEGIN
  -- Store current RLS setting
  SELECT current_setting('row_security', true)::boolean INTO v_old_rls;
  
  -- Disable RLS for this transaction
  PERFORM set_config('row_security', 'off', true);
  
  -- Update the quest to active with started_at
  UPDATE public.quests
  SET 
    status = 'active',
    started_at = NOW()::timestamp
  WHERE public.quests.id = p_quest_id;
  
  -- Restore RLS setting
  PERFORM set_config('row_security', CASE WHEN v_old_rls THEN 'on' ELSE 'off' END, true);
  
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

-- Function to CLOSE a quest (WITH RLS BYPASS)
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
DECLARE
  v_old_rls boolean;
BEGIN
  -- Store current RLS setting
  SELECT current_setting('row_security', true)::boolean INTO v_old_rls;
  
  -- Disable RLS for this transaction
  PERFORM set_config('row_security', 'off', true);
  
  -- Update the quest to closed
  UPDATE public.quests
  SET 
    status = 'closed',
    ended_at = NOW()::timestamp
  WHERE public.quests.id = p_quest_id;
  
  -- Restore RLS setting
  PERFORM set_config('row_security', CASE WHEN v_old_rls THEN 'on' ELSE 'off' END, true);
  
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION close_quest(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION activate_quest(uuid) TO authenticated, anon, service_role;

SELECT 'Alternative RPC functions created with RLS bypass!' as status;
