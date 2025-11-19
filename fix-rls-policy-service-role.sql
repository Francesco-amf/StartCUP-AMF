-- ============================================================================
-- FIX: Add RLS Policy for service_role to UPDATE quests
-- ============================================================================

-- Create policy that allows service_role to update any quest
CREATE POLICY "Allow service_role to update quests"
ON public.quests
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies
SELECT 
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'quests' AND cmd = 'UPDATE'
ORDER BY policyname;
