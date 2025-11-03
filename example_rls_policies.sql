-- ==========================================
-- EXAMPLE: RLS Policies for Quests Table
-- ==========================================

-- Enable RLS on the quests table
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Policies for SELECT (Read)
-- ==========================================

-- Policy: Allow teams to read all quests
CREATE POLICY "Allow teams to read all quests" ON quests
FOR SELECT
TO authenticated
USING (true);

-- ==========================================
-- Policies for INSERT (Create)
-- ==========================================

-- Policy: Allow admins to create quests
CREATE POLICY "Allow admins to create quests" ON quests
FOR INSERT
TO authenticated
WITH CHECK (get_my_claim('role') = 'admin');

-- ==========================================
-- Policies for UPDATE (Update)
-- ==========================================

-- Policy: Allow admins to update quests
CREATE POLICY "Allow admins to update quests" ON quests
FOR UPDATE
TO authenticated
USING (get_my_claim('role') = 'admin');

-- ==========================================
-- Policies for DELETE (Delete)
-- ==========================================

-- Policy: Allow admins to delete quests
CREATE POLICY "Allow admins to delete quests" ON quests
FOR DELETE
TO authenticated
USING (get_my_claim('role') = 'admin');

-- ==========================================
-- Helper Functions
-- ==========================================

-- Function to get a value from the user's JWT claims
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT) RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb ->> claim;
$$ LANGUAGE sql STABLE;
