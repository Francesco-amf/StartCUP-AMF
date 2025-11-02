-- ==========================================
-- FIX: Enable RLS on teams table
-- ==========================================
-- This fixes the issue where team data is not returned
-- in nested Supabase queries for evaluators

-- Enable Row Level Security on teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "Todos podem ver teams" ON teams;
DROP POLICY IF EXISTS "Teams podem atualizar seus dados" ON teams;
DROP POLICY IF EXISTS "Authenticated users podem criar teams" ON teams;

-- Allow all authenticated users to SELECT team data
-- This is safe because team information is public during the event
CREATE POLICY "Todos podem ver teams"
ON teams
FOR SELECT
TO authenticated
USING (true);

-- Allow teams to update their own data (email-based)
CREATE POLICY "Teams podem atualizar seus dados"
ON teams
FOR UPDATE
TO authenticated
USING (email = auth.jwt()->>'email')
WITH CHECK (email = auth.jwt()->>'email');

-- Allow inserting teams (for setup)
CREATE POLICY "Authenticated users podem criar teams"
ON teams
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verify the policies were created
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'teams'
ORDER BY policyname;
