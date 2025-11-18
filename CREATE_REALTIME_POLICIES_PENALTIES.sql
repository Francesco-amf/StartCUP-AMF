-- ============================================================================
-- CREATE REALTIME POLICIES FOR PENALTIES TABLE
-- This enables Realtime access for the penalties table
-- ============================================================================

-- IMPORTANT: Realtime Policies are SEPARATE from RLS Policies
-- They control who can SUBSCRIBE to Realtime changes, not just SELECT

-- Step 1: Create Realtime policy for ANON users
INSERT INTO realtime.subscription (claims, subscription_id, entity)
SELECT json_build_object('role', 'anon'::text), gen_random_uuid(), json_build_object('schema', 'public'::text, 'table', 'penalties'::text, 'columns', '*'::text)
WHERE NOT EXISTS (
  SELECT 1 FROM realtime.subscription
  WHERE claims->>'role' = 'anon'
  AND entity->>'table' = 'penalties'
);

-- Step 2: Create Realtime policy for AUTHENTICATED users
INSERT INTO realtime.subscription (claims, subscription_id, entity)
SELECT json_build_object('role', 'authenticated'::text), gen_random_uuid(), json_build_object('schema', 'public'::text, 'table', 'penalties'::text, 'columns', '*'::text)
WHERE NOT EXISTS (
  SELECT 1 FROM realtime.subscription
  WHERE claims->>'role' = 'authenticated'
  AND entity->>'table' = 'penalties'
);

-- Step 3: Verify the table is published to supabase_realtime
SELECT
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE tablename = 'penalties'
AND schemaname = 'public';

-- Step 4: Success message
SELECT '✅ REALTIME POLICIES CREATED FOR PENALTIES!' AS status;
SELECT '✅ Anon and authenticated users can now subscribe to penalties changes' AS detail1;
SELECT '⚠️ CRITICAL: Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)' AS detail2;
SELECT '✅ Test: Apply a penalty - should appear INSTANTLY!' AS detail3;
