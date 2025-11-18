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
-- Note: live_ranking is a VIEW, not a table - no RLS needed for views
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
-- STEP 4: Grant necessary permissions to service_role (used by Realtime)
-- ============================================================================
-- Note: live_ranking is a VIEW, so it inherits permissions from its base tables
-- RLS on base tables (e.g., team_scores) controls access to the view
GRANT SELECT ON public.penalties TO service_role;
GRANT SELECT ON public.event_config TO service_role;
GRANT SELECT ON public.live_ranking TO service_role;
GRANT SELECT ON public.teams TO service_role;

-- ============================================================================
-- STEP 5: Verify Realtime publication includes these tables
-- ============================================================================
-- IMPORTANT: This must be done in Supabase dashboard:
-- Database -> Publications -> supabase_realtime
-- Make sure these tables are published:
-- - penalties (for penalty updates)
-- - event_config (for phase updates)
-- - live_ranking (for ranking updates via its base tables)

-- ============================================================================
-- SUCCESS
-- ============================================================================
SELECT '✅ REALTIME RLS FIX APPLIED!' AS status;
SELECT '✅ All policies now allow SELECT for authenticated and anon users' AS detail1;
SELECT '✅ Service role has full SELECT permissions' AS detail2;
SELECT '⚠️ NEXT: Check Supabase Dashboard > Database > Publications > supabase_realtime' AS detail3;
SELECT '✅ Ensure penalties, event_config, and live_ranking are published' AS detail4;
