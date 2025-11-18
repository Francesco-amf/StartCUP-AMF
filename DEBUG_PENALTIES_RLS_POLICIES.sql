-- ============================================================================
-- DEBUG: Check RLS Policies for penalties table
-- This verifies if RLS policies allow anon role to read penalties
-- ============================================================================

-- Section 1: Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('penalties', 'live_ranking');

-- Section 2: List ALL RLS policies on penalties table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual as where_clause,
  with_check
FROM pg_policies
WHERE tablename = 'penalties'
ORDER BY policyname;

-- Section 3: List ALL RLS policies on live_ranking table (for comparison - this WORKS)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual as where_clause,
  with_check
FROM pg_policies
WHERE tablename = 'live_ranking'
ORDER BY policyname;

-- Section 4: Check table privileges for different roles
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'penalties'
ORDER BY grantee, privilege_type;

-- Section 5: Check table privileges for live_ranking (comparison)
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'live_ranking'
ORDER BY grantee, privilege_type;

-- Section 6: Check if penaltiestable is published to realtime publication
SELECT
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE (tablename = 'penalties' OR tablename = 'live_ranking')
AND schemaname = 'public'
ORDER BY pubname, tablename;

-- Section 7: List ALL publications
SELECT
  pubname,
  pubowner,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete,
  pubtruncate,
  pubviaroot
FROM pg_publication
ORDER BY pubname;

-- Section 8: Verify trigger functions
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('penalties', 'submissions', 'event_config')
ORDER BY event_object_table, trigger_name;
