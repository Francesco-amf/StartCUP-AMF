-- ============================================================================
-- COMPLETE RLS FIX: Remove ALL recursion in RLS policies
-- ============================================================================
-- This script DISABLES and removes ALL RLS policies that use get_my_team_id()
-- Then recreates them with email-based lookups instead.
-- This is a COMPLETE fix that handles all tables at once.

-- ============================================================================
-- STEP 1: DISABLE RLS TEMPORARILY (to avoid recursion errors)
-- ============================================================================

ALTER TABLE IF EXISTS teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS penalties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS power_ups DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP ALL PROBLEMATIC POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Allow teams to read their own submissions" ON submissions;
DROP POLICY IF EXISTS "Allow teams to create submissions" ON submissions;
DROP POLICY IF EXISTS "Allow teams to read their own evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow teams to read their own penalties" ON penalties;
DROP POLICY IF EXISTS "Allow teams to update power_ups" ON power_ups;
DROP POLICY IF EXISTS "Allow teams to update their own team" ON teams;

-- ============================================================================
-- STEP 3: RE-ENABLE RLS
-- ============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_ups ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: RECREATE ALL POLICIES WITH EMAIL-BASED LOOKUPS (NO RECURSION)
-- ============================================================================

-- ============ TEAMS ============
CREATE POLICY "Allow all read access to teams" ON teams
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow anon read access to teams" ON teams
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow admin to create teams" ON teams
FOR INSERT
TO authenticated
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Allow admin to update all teams" ON teams
FOR UPDATE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin')
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Allow teams to update their own team" ON teams
FOR UPDATE
TO authenticated
USING (email = current_setting('request.jwt.claims', true)::jsonb->>'email')
WITH CHECK (email = current_setting('request.jwt.claims', true)::jsonb->>'email');

CREATE POLICY "Allow admin to delete teams" ON teams
FOR DELETE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ============ SUBMISSIONS ============
CREATE POLICY "Allow admin and evaluators to read all submissions" ON submissions
FOR SELECT
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator'));

CREATE POLICY "Allow teams to read their own submissions" ON submissions
FOR SELECT
TO authenticated
USING (
  team_id = (
    SELECT id FROM public.teams
    WHERE email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    LIMIT 1
  )
  OR current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator')
);

CREATE POLICY "Allow anon read access to submissions" ON submissions
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow teams to create submissions" ON submissions
FOR INSERT
TO authenticated
WITH CHECK (
  team_id = (
    SELECT id FROM public.teams
    WHERE email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    LIMIT 1
  )
);

CREATE POLICY "Allow evaluators to update submissions" ON submissions
FOR UPDATE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'evaluator');

CREATE POLICY "Allow admin to delete submissions" ON submissions
FOR DELETE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ============ EVALUATIONS ============
CREATE POLICY "Allow admin and evaluators to read all evaluations" ON evaluations
FOR SELECT
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator'));

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
  OR current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator')
);

CREATE POLICY "Allow anon read access to evaluations" ON evaluations
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow evaluators to create evaluations" ON evaluations
FOR INSERT
TO authenticated
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'evaluator');

CREATE POLICY "Allow evaluators to update their own evaluations" ON evaluations
FOR UPDATE
TO authenticated
USING (evaluator_id = auth.uid());

CREATE POLICY "Allow admin to delete evaluations" ON evaluations
FOR DELETE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ============ PENALTIES ============
CREATE POLICY "Allow admin and evaluators to read all penalties" ON penalties
FOR SELECT
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator'));

CREATE POLICY "Allow teams to read their own penalties" ON penalties
FOR SELECT
TO authenticated
USING (
  team_id = (
    SELECT id FROM public.teams
    WHERE email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    LIMIT 1
  )
  OR current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator')
);

CREATE POLICY "Allow anon read access to penalties" ON penalties
FOR SELECT
TO anon
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

-- ============ POWER_UPS ============
CREATE POLICY "Allow admin and teams to read all power_ups" ON power_ups
FOR SELECT
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'team'));

CREATE POLICY "Allow anon read access to power_ups" ON power_ups
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow admin to create power_ups" ON power_ups
FOR INSERT
TO authenticated
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

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

CREATE POLICY "Allow admin to delete power_ups" ON power_ups
FOR DELETE
TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ COMPLETE RLS RECURSION FIX APPLIED!' AS status;
SELECT '✅ All policies now use email-based lookup instead of get_my_team_id()' AS detail;
SELECT '✅ Try logging in with a team account now!' AS next_step;
