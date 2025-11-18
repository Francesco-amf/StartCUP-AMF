-- ============================================================================
-- FIX PENALTIES REALTIME - Drop restrictive RLS, enable Realtime broadcasting
-- ============================================================================
-- The issue: Current RLS policies on penalties are too restrictive
-- Realtime can't broadcast updates if policies block SELECT access
-- The solution: Allow authenticated users to READ all penalties
-- Security: Admin/evaluator can still CREATE, UPDATE, DELETE
-- ============================================================================

-- Step 1: Drop ALL existing penalties RLS policies (both read and write)
DROP POLICY IF EXISTS "Allow all roles to read penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin and evaluators to read all penalties" ON penalties;
DROP POLICY IF EXISTS "Allow teams to read their own penalties" ON penalties;
DROP POLICY IF EXISTS "Allow anon read access to penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin and evaluators to create penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin to update penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin to delete penalties" ON penalties;

-- Step 2: Create OPEN READ policy for all authenticated users
-- This allows Realtime to broadcast penalty updates to all clients
CREATE POLICY "Allow authenticated to read all penalties" ON penalties
FOR SELECT
TO authenticated
USING (true);

-- Also allow anon (unauthenticated) to read penalties for public dashboards
CREATE POLICY "Allow anon to read all penalties" ON penalties
FOR SELECT
TO anon
USING (true);

-- Step 3: Create INSERT policy - only admin/evaluators can create penalties
CREATE POLICY "Allow admin and evaluators to create penalties" ON penalties
FOR INSERT
TO authenticated
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator'));

-- Step 4: Create UPDATE policy - only admin can update
CREATE POLICY "Allow admin to update penalties" ON penalties
FOR UPDATE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin')
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- Step 5: Create DELETE policy - only admin can delete
CREATE POLICY "Allow admin to delete penalties" ON penalties
FOR DELETE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- Step 6: Grant service_role permissions (used by Realtime for broadcasting)
GRANT SELECT ON public.penalties TO service_role;
GRANT INSERT ON public.penalties TO service_role;
GRANT UPDATE ON public.penalties TO service_role;
GRANT DELETE ON public.penalties TO service_role;

-- Step 7: Success!
SELECT '✅ PENALTIES REALTIME FIX APPLIED!' AS status;
SELECT '✅ All authenticated users can now READ penalties (enables Realtime)' AS detail1;
SELECT '✅ Write security maintained: Only admin/evaluators can CREATE' AS detail2;
SELECT '✅ Only admin can UPDATE or DELETE penalties' AS detail3;
SELECT '⚠️ IMPORTANT: Check Supabase Dashboard > Database > Publications' AS detail4;
SELECT '✅ Ensure penalties table IS PUBLISHED to supabase_realtime' AS detail5;
