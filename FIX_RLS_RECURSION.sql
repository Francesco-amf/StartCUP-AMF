-- ============================================================================
-- FIX: Remove infinite recursion in RLS policies caused by get_my_team_id()
-- ============================================================================
-- The get_my_team_id() function was querying the teams table, which triggered
-- RLS policies that called the function again, causing infinite recursion.
-- This script replaces those policies with email-based lookups instead.

-- ============================================================================
-- Step 1: Fix evaluations table
-- ============================================================================

DROP POLICY IF EXISTS "Allow teams to read their own evaluations" ON evaluations;

CREATE POLICY "Allow teams to read their own evaluations" ON evaluations
FOR SELECT
TO authenticated
USING (
  submission_id IN (
    SELECT id FROM submissions
    WHERE team_id = (
      SELECT id FROM public.teams
      WHERE email = current_setting('request.jwt.claims', true)::jsonb->>'email'
      LIMIT 1
    )
  )
  OR get_my_claim('role') IN ('admin', 'evaluator')
);

-- ============================================================================
-- Step 2: Fix penalties table
-- ============================================================================

DROP POLICY IF EXISTS "Allow teams to read their own penalties" ON penalties;

CREATE POLICY "Allow teams to read their own penalties" ON penalties
FOR SELECT
TO authenticated
USING (
  team_id = (
    SELECT id FROM public.teams
    WHERE email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    LIMIT 1
  )
  OR get_my_claim('role') IN ('admin', 'evaluator')
);

-- ============================================================================
-- Step 3: Fix power_ups table
-- ============================================================================

DROP POLICY IF EXISTS "Allow teams to update power_ups" ON power_ups;

CREATE POLICY "Allow teams to update power_ups" ON power_ups
FOR UPDATE
TO authenticated
USING (
  team_id = (
    SELECT id FROM public.teams
    WHERE email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    LIMIT 1
  )
)
WITH CHECK (
  team_id = (
    SELECT id FROM public.teams
    WHERE email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    LIMIT 1
  )
);

-- ============================================================================
-- Step 4: Verify all policies are fixed
-- ============================================================================
-- After running this script, no RLS policies should use get_my_team_id()
-- You can verify by checking: SELECT * FROM pg_policies;

SELECT 'RLS Recursion Fix Complete' AS status;
