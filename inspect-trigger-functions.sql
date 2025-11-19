-- ============================================================================
-- INSPECT: View trigger function code
-- ============================================================================

-- Get the definition of set_quest_started_at_on_activate function
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('set_quest_started_at_on_activate', 'adjust_event_end_time_for_last_quest');

-- Also check if there are any CHECK constraints
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'quests'
AND con.contype = 'c';
