-- ============================================================================
-- INVESTIGATE: Triggers, Rules, and Policies on quests table
-- ============================================================================

-- 1. Check all triggers on quests table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'quests'
ORDER BY trigger_name;

-- 2. Check all RLS policies on quests table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'quests'
ORDER BY policyname;

-- 3. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'quests';

-- 4. Check for any rules
SELECT 
    tablename,
    rulename,
    definition
FROM pg_rules
WHERE tablename = 'quests';

-- 5. Check table owner
SELECT 
    tableowner
FROM pg_tables
WHERE tablename = 'quests';
