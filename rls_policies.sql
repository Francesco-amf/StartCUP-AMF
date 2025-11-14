-- ==========================================
-- RLS Policies
-- ==========================================

-- Helper function to get the email of the current user
CREATE OR REPLACE FUNCTION get_my_email() RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb ->> 'email';
$$ LANGUAGE sql STABLE;

-- ⚠️ DEPRECATED: get_my_team_id() was causing infinite recursion in RLS policies
-- It queried the teams table, which triggered RLS policies that called this function again
-- Solution: Use inline subqueries with LIMIT 1 and email-based lookups instead
-- See updated policies for teams and submissions tables

-- Helper function to get a value from the user's JWT claims
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT) RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb ->> claim;
$$ LANGUAGE sql STABLE;

-- ==========================================
-- quests
-- ==========================================

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access to quests" ON quests
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow anon read access to quests" ON quests
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow admin to create quests" ON quests
FOR INSERT
TO authenticated
WITH CHECK (get_my_claim('role') = 'admin');

CREATE POLICY "Allow admin to update quests" ON quests
FOR UPDATE
TO authenticated
USING (get_my_claim('role') = 'admin');

CREATE POLICY "Allow admin to delete quests" ON quests
FOR DELETE
TO authenticated
USING (get_my_claim('role') = 'admin');

-- ==========================================
-- phases
-- ==========================================

ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access to phases" ON phases
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow anon read access to phases" ON phases
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow admin to create phases" ON phases
FOR INSERT
TO authenticated
WITH CHECK (get_my_claim('role') = 'admin');

CREATE POLICY "Allow admin to update phases" ON phases
FOR UPDATE
TO authenticated
USING (get_my_claim('role') = 'admin');

CREATE POLICY "Allow admin to delete phases" ON phases
FOR DELETE
TO authenticated
USING (get_my_claim('role') = 'admin');

-- ==========================================
-- submissions
-- ==========================================

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin and evaluators to read all submissions" ON submissions
FOR SELECT
TO authenticated
USING (get_my_claim('role') IN ('admin', 'evaluator'));

CREATE POLICY "Allow teams to read their own submissions" ON submissions
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
USING (get_my_claim('role') = 'evaluator');

CREATE POLICY "Allow admin to delete submissions" ON submissions
FOR DELETE
TO authenticated
USING (get_my_claim('role') = 'admin');

-- ==========================================
-- teams
-- ==========================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

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
WITH CHECK (get_my_claim('role') = 'admin');

CREATE POLICY "Allow admin to update all teams" ON teams
FOR UPDATE
TO authenticated
USING (get_my_claim('role') = 'admin')
WITH CHECK (get_my_claim('role') = 'admin');

CREATE POLICY "Allow teams to update their own team" ON teams
FOR UPDATE
TO authenticated
USING (email = current_setting('request.jwt.claims', true)::jsonb->>'email')
WITH CHECK (email = current_setting('request.jwt.claims', true)::jsonb->>'email');

CREATE POLICY "Allow admin to delete teams" ON teams
FOR DELETE
TO authenticated
USING (get_my_claim('role') = 'admin');

-- ==========================================
-- event_config
-- ==========================================

ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access to event_config" ON event_config
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow anon read access to event_config" ON event_config
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow admin to update event_config" ON event_config
FOR UPDATE
TO authenticated
USING (get_my_claim('role') = 'admin');

-- ==========================================
-- evaluations
-- ==========================================

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin and evaluators to read all evaluations" ON evaluations
FOR SELECT
TO authenticated
USING (get_my_claim('role') IN ('admin', 'evaluator'));

CREATE POLICY "Allow teams to read their own evaluations" ON evaluations
FOR SELECT
TO authenticated
USING (submission_id IN (SELECT id FROM submissions WHERE team_id = get_my_team_id()));

CREATE POLICY "Allow anon read access to evaluations" ON evaluations
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow evaluators to create evaluations" ON evaluations
FOR INSERT
TO authenticated
WITH CHECK (get_my_claim('role') = 'evaluator');

CREATE POLICY "Allow evaluators to update their own evaluations" ON evaluations
FOR UPDATE
TO authenticated
USING (evaluator_id = auth.uid());

CREATE POLICY "Allow admin to delete evaluations" ON evaluations
FOR DELETE
TO authenticated
USING (get_my_claim('role') = 'admin');

-- ==========================================
-- penalties
-- ==========================================

ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin and evaluators to read all penalties" ON penalties
FOR SELECT
TO authenticated
USING (get_my_claim('role') IN ('admin', 'evaluator'));

CREATE POLICY "Allow teams to read their own penalties" ON penalties
FOR SELECT
TO authenticated
USING (team_id = get_my_team_id());

CREATE POLICY "Allow anon read access to penalties" ON penalties
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow admin and evaluators to create penalties" ON penalties
FOR INSERT
TO authenticated
WITH CHECK (get_my_claim('role') IN ('admin', 'evaluator'));

CREATE POLICY "Allow admin to update penalties" ON penalties
FOR UPDATE
TO authenticated
USING (get_my_claim('role') = 'admin');

CREATE POLICY "Allow admin to delete penalties" ON penalties
FOR DELETE
TO authenticated
USING (get_my_claim('role') = 'admin');

-- ==========================================
-- power_ups
-- ==========================================

ALTER TABLE power_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin and teams to read all power_ups" ON power_ups
FOR SELECT
TO authenticated
USING (get_my_claim('role') IN ('admin', 'team'));

CREATE POLICY "Allow anon read access to power_ups" ON power_ups
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow admin to create power_ups" ON power_ups
FOR INSERT
TO authenticated
WITH CHECK (get_my_claim('role') = 'admin');

CREATE POLICY "Allow teams to update power_ups" ON power_ups
FOR UPDATE
TO authenticated
USING (team_id = get_my_team_id());

CREATE POLICY "Allow admin to delete power_ups" ON power_ups
FOR DELETE
TO authenticated
USING (get_my_claim('role') = 'admin');