-- Check current RLS policies on penalties table
SELECT
  policyname,
  permissive,
  roles::text,
  qual as policy_condition,
  with_check
FROM pg_policies
WHERE tablename = 'penalties'
ORDER BY policyname;
