-- ============================================================================
-- FIX REALTIME RLS: Ensuring Realtime can broadcast updates to clients
-- ============================================================================
-- The issue: RLS policies may block Realtime from sending updates
-- The solution: Ensure policies allow the 'realtime' and 'authenticated' roles to SELECT
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify RLS is enabled (needed for Realtime)
-- ============================================================================
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: CRITICAL FIX - Ensure anon and authenticated can READ penalties
-- (Realtime requires SELECT access to broadcast changes)
-- ============================================================================

-- Drop existing policies if they're too restrictive
DROP POLICY IF EXISTS "Allow anon read access to penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin and evaluators to read all penalties" ON penalties;
DROP POLICY IF EXISTS "Allow teams to read their own penalties" ON penalties;

-- Create OPEN READ policies for Realtime to work
CREATE POLICY "Allow all roles to read penalties for Realtime" ON penalties
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Allow admin and evaluators to create penalties" ON penalties
FOR INSERT
TO authenticated
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator'));

CREATE POLICY "Allow admin to update penalties" ON penalties
FOR UPDATE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Allow admin to delete penalties" ON penalties
FOR DELETE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ============================================================================
-- STEP 3: Ensure event_config can be read by all (needed for phase updates)
-- ============================================================================
DROP POLICY IF EXISTS "Allow all read access to event_config" ON event_config;
DROP POLICY IF EXISTS "Allow anon read access to event_config" ON event_config;

CREATE POLICY "Allow all roles to read event_config for Realtime" ON event_config
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Allow admin to update event_config" ON event_config
FOR UPDATE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ============================================================================
-- STEP 4: Ensure live_ranking can be read by all (needed for ranking updates)
-- ============================================================================
DROP POLICY IF EXISTS "Allow all read access to live_ranking" ON live_ranking;
DROP POLICY IF EXISTS "Allow anon read access to live_ranking" ON live_ranking;

CREATE POLICY "Allow all roles to read live_ranking for Realtime" ON live_ranking
FOR SELECT
TO authenticated, anon
USING (true);

-- ============================================================================
-- STEP 5: Grant necessary permissions to service_role (used by Realtime)
-- ============================================================================
GRANT SELECT ON public.penalties TO service_role;
GRANT SELECT ON public.event_config TO service_role;
GRANT SELECT ON public.live_ranking TO service_role;
GRANT SELECT ON public.teams TO service_role;

-- ============================================================================
-- STEP 6: Verify Realtime publication includes these tables
-- ============================================================================
-- Note: This usually needs to be done in Supabase dashboard:
-- Database -> Publications -> supabase_realtime
-- Make sure these tables are published:
-- - penalties (for penalty updates)
-- - event_config (for phase updates)
-- - live_ranking (for ranking updates)

-- ============================================================================
-- STEP 7: SUCCESS
-- ============================================================================
SELECT '✅ REALTIME RLS FIX APPLIED!' AS status;
SELECT '✅ All policies now allow SELECT for authenticated and anon users' AS detail1;
SELECT '✅ Service role has full SELECT permissions' AS detail2;
SELECT '✅ Check Supabase Dashboard > Database > Publications to ensure tables are published' AS detail3;
