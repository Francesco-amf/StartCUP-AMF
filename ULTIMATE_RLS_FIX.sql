-- ============================================================================
-- ULTIMATE RLS FIX: Complete removal and recreation of all RLS policies
-- ============================================================================
-- This script DISABLES RLS, DROPS ALL POLICIES, RE-ENABLES RLS,
-- and RECREATES all policies with email-based lookups (no recursion).

-- ============================================================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- ============================================================================

ALTER TABLE IF EXISTS quests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS phases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS penalties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS power_ups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_config DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP ALL EXISTING POLICIES (ALL OF THEM)
-- ============================================================================

-- Teams
DROP POLICY IF EXISTS "Allow all read access to teams" ON teams;
DROP POLICY IF EXISTS "Allow anon read access to teams" ON teams;
DROP POLICY IF EXISTS "Allow admin to create teams" ON teams;
DROP POLICY IF EXISTS "Allow admin to update all teams" ON teams;
DROP POLICY IF EXISTS "Allow teams to update their own team" ON teams;
DROP POLICY IF EXISTS "Allow admin to delete teams" ON teams;

-- Submissions
DROP POLICY IF EXISTS "Allow admin and evaluators to read all submissions" ON submissions;
DROP POLICY IF EXISTS "Allow teams to read their own submissions" ON submissions;
DROP POLICY IF EXISTS "Allow anon read access to submissions" ON submissions;
DROP POLICY IF EXISTS "Allow teams to create submissions" ON submissions;
DROP POLICY IF EXISTS "Allow evaluators to update submissions" ON submissions;
DROP POLICY IF EXISTS "Allow admin to delete submissions" ON submissions;

-- Evaluations
DROP POLICY IF EXISTS "Allow admin and evaluators to read all evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow teams to read their own evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow anon read access to evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow evaluators to create evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow evaluators to update their own evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow admin to delete evaluations" ON evaluations;

-- Penalties
DROP POLICY IF EXISTS "Allow admin and evaluators to read all penalties" ON penalties;
DROP POLICY IF EXISTS "Allow teams to read their own penalties" ON penalties;
DROP POLICY IF EXISTS "Allow anon read access to penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin and evaluators to create penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin to update penalties" ON penalties;
DROP POLICY IF EXISTS "Allow admin to delete penalties" ON penalties;

-- Power Ups
DROP POLICY IF EXISTS "Allow admin and teams to read all power_ups" ON power_ups;
DROP POLICY IF EXISTS "Allow anon read access to power_ups" ON power_ups;
DROP POLICY IF EXISTS "Allow admin to create power_ups" ON power_ups;
DROP POLICY IF EXISTS "Allow teams to update power_ups" ON power_ups;
DROP POLICY IF EXISTS "Allow admin to delete power_ups" ON power_ups;

-- Quests
DROP POLICY IF EXISTS "Allow all read access to quests" ON quests;
DROP POLICY IF EXISTS "Allow anon read access to quests" ON quests;
DROP POLICY IF EXISTS "Allow admin to create quests" ON quests;
DROP POLICY IF EXISTS "Allow admin to update quests" ON quests;
DROP POLICY IF EXISTS "Allow admin to delete quests" ON quests;

-- Phases
DROP POLICY IF EXISTS "Allow all read access to phases" ON phases;
DROP POLICY IF EXISTS "Allow anon read access to phases" ON phases;
DROP POLICY IF EXISTS "Allow admin to create phases" ON phases;
DROP POLICY IF EXISTS "Allow admin to update phases" ON phases;
DROP POLICY IF EXISTS "Allow admin to delete phases" ON phases;

-- Event Config
DROP POLICY IF EXISTS "Allow all read access to event_config" ON event_config;
DROP POLICY IF EXISTS "Allow anon read access to event_config" ON event_config;
DROP POLICY IF EXISTS "Allow admin to update event_config" ON event_config;

-- ============================================================================
-- STEP 3: RE-ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: RECREATE ALL POLICIES (WITHOUT get_my_team_id() function)
-- ============================================================================

-- ========== QUESTS ==========
CREATE POLICY "Allow all read access to quests" ON quests
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow anon read access to quests" ON quests
FOR SELECT TO anon USING (true);

CREATE POLICY "Allow admin to create quests" ON quests
FOR INSERT TO authenticated
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Allow admin to update quests" ON quests
FOR UPDATE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Allow admin to delete quests" ON quests
FOR DELETE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ========== PHASES ==========
CREATE POLICY "Allow all read access to phases" ON phases
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow anon read access to phases" ON phases
FOR SELECT TO anon USING (true);

CREATE POLICY "Allow admin to create phases" ON phases
FOR INSERT TO authenticated
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Allow admin to update phases" ON phases
FOR UPDATE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Allow admin to delete phases" ON phases
FOR DELETE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ========== TEAMS ==========
CREATE POLICY "Allow all read access to teams" ON teams
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow anon read access to teams" ON teams
FOR SELECT TO anon USING (true);

CREATE POLICY "Allow admin to create teams" ON teams
FOR INSERT TO authenticated
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Allow admin to update all teams" ON teams
FOR UPDATE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin')
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Allow teams to update their own team" ON teams
FOR UPDATE TO authenticated
USING (email = current_setting('request.jwt.claims', true)::jsonb->>'email')
WITH CHECK (email = current_setting('request.jwt.claims', true)::jsonb->>'email');

CREATE POLICY "Allow admin to delete teams" ON teams
FOR DELETE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ========== SUBMISSIONS ==========
CREATE POLICY "Allow admin and evaluators to read all submissions" ON submissions
FOR SELECT TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator'));

CREATE POLICY "Allow teams to read their own submissions" ON submissions
FOR SELECT TO authenticated
USING (
  team_id = (
    SELECT id FROM public.teams
    WHERE email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    LIMIT 1
  )
  OR current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator')
);

CREATE POLICY "Allow anon read access to submissions" ON submissions
FOR SELECT TO anon USING (true);

CREATE POLICY "Allow teams to create submissions" ON submissions
FOR INSERT TO authenticated
WITH CHECK (
  team_id = (
    SELECT id FROM public.teams
    WHERE email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    LIMIT 1
  )
);

CREATE POLICY "Allow evaluators to update submissions" ON submissions
FOR UPDATE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'evaluator');

CREATE POLICY "Allow admin to delete submissions" ON submissions
FOR DELETE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ========== EVALUATIONS ==========
CREATE POLICY "Allow admin and evaluators to read all evaluations" ON evaluations
FOR SELECT TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator'));

CREATE POLICY "Allow teams to read their own evaluations" ON evaluations
FOR SELECT TO authenticated
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
FOR SELECT TO anon USING (true);

CREATE POLICY "Allow evaluators to create evaluations" ON evaluations
FOR INSERT TO authenticated
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'evaluator');

CREATE POLICY "Allow evaluators to update their own evaluations" ON evaluations
FOR UPDATE TO authenticated
USING (evaluator_id = auth.uid());

CREATE POLICY "Allow admin to delete evaluations" ON evaluations
FOR DELETE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ========== PENALTIES ==========
CREATE POLICY "Allow admin and evaluators to read all penalties" ON penalties
FOR SELECT TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator'));

CREATE POLICY "Allow teams to read their own penalties" ON penalties
FOR SELECT TO authenticated
USING (
  team_id = (
    SELECT id FROM public.teams
    WHERE email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    LIMIT 1
  )
  OR current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator')
);

CREATE POLICY "Allow anon read access to penalties" ON penalties
FOR SELECT TO anon USING (true);

CREATE POLICY "Allow admin and evaluators to create penalties" ON penalties
FOR INSERT TO authenticated
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'evaluator'));

CREATE POLICY "Allow admin to update penalties" ON penalties
FOR UPDATE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Allow admin to delete penalties" ON penalties
FOR DELETE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ========== POWER_UPS ==========
CREATE POLICY "Allow admin and teams to read all power_ups" ON power_ups
FOR SELECT TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('admin', 'team'));

CREATE POLICY "Allow anon read access to power_ups" ON power_ups
FOR SELECT TO anon USING (true);

CREATE POLICY "Allow admin to create power_ups" ON power_ups
FOR INSERT TO authenticated
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Allow teams to update power_ups" ON power_ups
FOR UPDATE TO authenticated
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
FOR DELETE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ========== EVENT_CONFIG ==========
CREATE POLICY "Allow all read access to event_config" ON event_config
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow anon read access to event_config" ON event_config
FOR SELECT TO anon USING (true);

CREATE POLICY "Allow admin to update event_config" ON event_config
FOR UPDATE TO authenticated
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- ============================================================================
-- SUCCESS CONFIRMATION
-- ============================================================================
SELECT '✅ ULTIMATE RLS FIX COMPLETE!' AS status;
SELECT '✅ All RLS policies recreated with email-based lookups' AS detail_1;
SELECT '✅ Zero recursion - all policies use direct JWT claims' AS detail_2;
SELECT '✅ Ready to test team login!' AS next_step;
