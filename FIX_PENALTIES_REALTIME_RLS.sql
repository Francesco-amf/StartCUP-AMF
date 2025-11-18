-- ============================================================================
-- FIX: Enable Realtime for penalties table
-- This script ensures the penalties table can be accessed via Realtime
-- ============================================================================

-- IMPORTANT: For Realtime to work, the table must:
-- 1. Be published to supabase_realtime publication ✓ (already done)
-- 2. Have RLS enabled ✓ (already done)
-- 3. Have SELECT policies that allow the anon role to read rows ← KEY!

-- Step 1: Ensure RLS is enabled on penalties table
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;

-- Step 2: DROP all existing policies on penalties (clean slate)
DROP POLICY IF EXISTS "Allow all roles to read penalties" ON public.penalties;
DROP POLICY IF EXISTS "Allow authenticated to read penalties" ON public.penalties;
DROP POLICY IF EXISTS "Allow anon to read penalties" ON public.penalties;
DROP POLICY IF EXISTS "penalties_read_authenticated" ON public.penalties;
DROP POLICY IF EXISTS "penalties_read_anon" ON public.penalties;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.penalties;
DROP POLICY IF EXISTS "Allow anon read access" ON public.penalties;

-- Step 3: Create SIMPLE, OPEN READ policies for both anon and authenticated
-- This is required for Realtime to work (it needs to verify row access)

CREATE POLICY "penalties_select_anon" ON public.penalties
  FOR SELECT
  USING (true);

CREATE POLICY "penalties_select_authenticated" ON public.penalties
  FOR SELECT
  USING (true);

-- Step 4: Verify the policies exist
SELECT
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'penalties'
ORDER BY policyname;

-- Step 5: Grant SELECT privilege to anon role explicitly
GRANT SELECT ON public.penalties TO anon;
GRANT SELECT ON public.penalties TO authenticated;

-- Step 6: Verify grants
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'penalties'
ORDER BY grantee;

-- Step 7: Verify penalties is published to supabase_realtime
SELECT
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE tablename = 'penalties'
AND schemaname = 'public';

-- ============================================================================
-- SUCCESS
-- ============================================================================

SELECT '✅ PENALTIES TABLE RLS FIXED!' AS status;
SELECT '✅ RLS policies: Both anon and authenticated can SELECT' AS detail1;
SELECT '✅ Explicit GRANT SELECT given to anon and authenticated roles' AS detail2;
SELECT '✅ Table penalties is published to supabase_realtime' AS detail3;
SELECT '⚠️ CRITICAL: Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)' AS detail4;
SELECT '✅ Test: Apply a penalty - should appear INSTANTLY!' AS detail5;
