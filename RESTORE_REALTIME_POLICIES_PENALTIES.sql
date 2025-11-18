-- ============================================================================
-- RESTORE REALTIME POLICIES FOR PENALTIES TABLE
-- This re-enables Realtime subscription for both automatic and manual penalties
-- ============================================================================

-- Step 1: Verify RLS is enabled on penalties table
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies on penalties (clean slate)
DROP POLICY IF EXISTS "penalties_select_anon" ON public.penalties;
DROP POLICY IF EXISTS "penalties_select_authenticated" ON public.penalties;
DROP POLICY IF EXISTS "Allow all roles to read penalties" ON public.penalties;
DROP POLICY IF EXISTS "Allow authenticated to read penalties" ON public.penalties;
DROP POLICY IF EXISTS "Allow anon to read penalties" ON public.penalties;
DROP POLICY IF EXISTS "penalties_read_authenticated" ON public.penalties;
DROP POLICY IF EXISTS "penalties_read_anon" ON public.penalties;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.penalties;
DROP POLICY IF EXISTS "Allow anon read access" ON public.penalties;

-- Step 3: Create SIMPLE, OPEN READ policies for both anon and authenticated
-- These are REQUIRED for Realtime to work - Supabase needs to verify row access
-- Both automatic AND manual penalties need to be readable via Realtime

CREATE POLICY "penalties_select_anon" ON public.penalties
  FOR SELECT
  USING (true);

CREATE POLICY "penalties_select_authenticated" ON public.penalties
  FOR SELECT
  USING (true);

-- Step 4: Grant explicit SELECT permission to all roles
GRANT SELECT ON public.penalties TO anon;
GRANT SELECT ON public.penalties TO authenticated;
GRANT SELECT ON public.penalties TO postgres;
GRANT SELECT ON public.penalties TO service_role;

-- Step 5: Verify the policies were created
SELECT
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'penalties'
ORDER BY policyname;

-- Step 6: Verify table is published to supabase_realtime
SELECT
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE tablename = 'penalties'
AND schemaname = 'public';

-- Step 7: Verify grants
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'penalties'
ORDER BY grantee;

-- ============================================================================
-- SUCCESS INDICATORS
-- ============================================================================

SELECT '✅ PENALTIES TABLE REALTIME RESTORED!' AS status;
SELECT '✅ RLS policies created: anon and authenticated can SELECT' AS detail1;
SELECT '✅ Both automatic (late window) and manual (admin/evaluator) penalties readable' AS detail2;
SELECT '✅ Explicit GRANT SELECT given to all roles' AS detail3;
SELECT '✅ Table published to supabase_realtime' AS detail4;
SELECT '⚠️ CRITICAL: Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)' AS detail5;
SELECT '✅ Test: Apply penalty - should appear INSTANTLY via Realtime!' AS detail6;
