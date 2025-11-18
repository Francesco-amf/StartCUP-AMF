-- ============================================================================
-- SIMPLE REALTIME RLS FIX - Just the essentials
-- Run this to fix Realtime subscription issues
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all read access to penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin and evaluators to read all penalties" ON penalties;
DROP POLICY IF EXISTS "Allow teams to read their own penalties" ON penalties;
DROP POLICY IF EXISTS "Allow anon read access to penalties" ON penalties;

-- Create OPEN read policy for Realtime to broadcast changes
CREATE POLICY "Allow all roles to read penalties" ON penalties
FOR SELECT
TO authenticated, anon
USING (true);

-- Keep existing write policies for security
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

-- Drop restrictive event_config policies
DROP POLICY IF EXISTS "Allow all read access to event_config" ON event_config;
DROP POLICY IF EXISTS "Allow anon read access to event_config" ON event_config;

-- Create OPEN read policy for event_config
CREATE POLICY "Allow all roles to read event_config" ON event_config
FOR SELECT
TO authenticated, anon
USING (true);

-- Keep existing write policies
CREATE POLICY "Allow admin to update event_config" ON event_config
FOR UPDATE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- Grant permissions to service_role (used by Realtime)
GRANT SELECT ON public.penalties TO service_role;
GRANT SELECT ON public.event_config TO service_role;
GRANT SELECT ON public.teams TO service_role;

-- Success!
SELECT '✅ REALTIME RLS FIX APPLIED!' AS status;
SELECT '✅ Penalties and event_config now readable by all for Realtime' AS detail1;
SELECT '✅ Service role has full SELECT permissions' AS detail2;
SELECT '⚠️ IMPORTANT: Check Supabase Dashboard > Database > Publications > supabase_realtime' AS detail3;
SELECT '✅ Ensure tables are published: penalties, event_config, live_ranking' AS detail4;
