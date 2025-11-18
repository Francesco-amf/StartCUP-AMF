-- ============================================================================
-- VERIFY DATABASE CHANGES
-- Run this in Supabase SQL Editor to verify the changes were applied
-- ============================================================================

-- Check if evaluators were added to auth.users
SELECT '=== AUTH.USERS (Evaluators) ===' AS check_1;
SELECT email, role FROM auth.users
WHERE email IN ('michael.silva@startcup-amf.com', 'bruna.leao@startcup-amf.com', 'outsiders@startcup-amf.com')
ORDER BY email;

-- Check if evaluators were added to public.evaluators
SELECT '' AS blank;
SELECT '=== PUBLIC.EVALUATORS ===' AS check_2;
SELECT name, email, role FROM public.evaluators
WHERE email IN ('michael.silva@startcup-amf.com', 'bruna.leao@startcup-amf.com')
ORDER BY name;

-- Check if team was renamed
SELECT '' AS blank;
SELECT '=== PUBLIC.TEAMS (Outsiders) ===' AS check_3;
SELECT name, email FROM public.teams
WHERE name = 'Outsiders' OR name = 'Mosaico';

-- Check total count
SELECT '' AS blank;
SELECT '=== SUMMARY ===' AS check_4;
SELECT 'Evaluators in auth.users' AS check_type, COUNT(*) AS count
FROM auth.users
WHERE email IN ('michael.silva@startcup-amf.com', 'bruna.leao@startcup-amf.com', 'outsiders@startcup-amf.com')
UNION ALL
SELECT 'Evaluators in public.evaluators' AS check_type, COUNT(*) AS count
FROM public.evaluators
WHERE email IN ('michael.silva@startcup-amf.com', 'bruna.leao@startcup-amf.com')
UNION ALL
SELECT 'Team renamed to Outsiders' AS check_type, COUNT(*) AS count
FROM public.teams
WHERE name = 'Outsiders';
