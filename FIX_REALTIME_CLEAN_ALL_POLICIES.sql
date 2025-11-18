-- ============================================================================
-- CRITICAL: Remove ALL conflicting policies and rebuild correctly
-- ============================================================================
-- Problem: Multiple conflicting policies (Allow all *, Allow all roles to read, etc)
-- Solution: Drop EVERYTHING and recreate cleanly
-- ============================================================================

-- Step 1: DROP ALL POLICIES ON PENALTIES (completely)
DROP POLICY IF EXISTS "Allow all read access" ON penalties;
DROP POLICY IF EXISTS "Allow all insert access" ON penalties;
DROP POLICY IF EXISTS "Allow all update access" ON penalties;
DROP POLICY IF EXISTS "Allow all delete access" ON penalties;
DROP POLICY IF EXISTS "Allow all roles to read penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin and evaluators to create penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin and evaluators to read all penalties" ON penalties;
DROP POLICY IF EXISTS "Allow teams to read their own penalties" ON penalties;
DROP POLICY IF EXISTS "Allow anon read access to penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin to update penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin to delete penalties" ON penalties;

-- Step 2: Ensure RLS is ENABLED
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

-- Step 3: Create ONLY the necessary policies (one by one, clearly)

-- Policy 1: OPEN READ for authenticated (Realtime needs this)
CREATE POLICY "penalties_read_authenticated" ON penalties
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: OPEN READ for anon (public dashboards)
CREATE POLICY "penalties_read_anon" ON penalties
FOR SELECT
TO anon
USING (true);

-- Policy 3: INSERT only admin/evaluators
CREATE POLICY "penalties_insert_admin_evaluators" ON penalties
FOR INSERT
TO authenticated
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator'));

-- Policy 4: UPDATE only admin
CREATE POLICY "penalties_update_admin" ON penalties
FOR UPDATE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin')
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- Policy 5: DELETE only admin
CREATE POLICY "penalties_delete_admin" ON penalties
FOR DELETE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- Step 4: Grant service_role permissions
GRANT SELECT ON public.penalties TO service_role;
GRANT INSERT ON public.penalties TO service_role;
GRANT UPDATE ON public.penalties TO service_role;
GRANT DELETE ON public.penalties TO service_role;

-- Step 5: Do the same for event_config (clean up conflicting policies)
DROP POLICY IF EXISTS "Allow all read access" ON event_config;
DROP POLICY IF EXISTS "Allow all update access" ON event_config;
DROP POLICY IF EXISTS "Allow all roles to read event_config" ON event_config;
DROP POLICY IF EXISTS "Allow anon read access to event_config" ON event_config;
DROP POLICY IF EXISTS "Allow admin to update event_config" ON event_config;

ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

-- Create clean event_config policies
CREATE POLICY "event_config_read_authenticated" ON event_config
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "event_config_read_anon" ON event_config
FOR SELECT
TO anon
USING (true);

CREATE POLICY "event_config_update_admin" ON event_config
FOR UPDATE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin')
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- Grant service_role permissions
GRANT SELECT ON public.event_config TO service_role;
GRANT UPDATE ON public.event_config TO service_role;

-- Success
SELECT '✅ ALL CONFLICTING POLICIES REMOVED!' AS status;
SELECT '✅ Clean policies applied to penalties' AS detail1;
SELECT '✅ Clean policies applied to event_config' AS detail2;
SELECT '⚠️ NOW CHECK: Is penalties published in Supabase Dashboard > Publications > supabase_realtime?' AS detail3;
SELECT '✅ If penalties is NOT published, click Edit and check the box!' AS detail4;
