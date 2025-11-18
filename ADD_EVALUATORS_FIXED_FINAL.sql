-- ============================================================================
-- ADD NEW EVALUATORS AND UPDATE TEAM - WITH CORRECT EMAIL PROVIDER
-- This version has the correct raw_app_meta_data structure for authentication
-- ============================================================================

-- ============================================================================
-- 1. ADD EVALUATOR: Michael Silva
-- ============================================================================
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'michael.silva@startcup-amf.com',
  crypt('MSEvaluator@2025!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"evaluator"}'::jsonb,
  false,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Add to evaluators table
INSERT INTO public.evaluators (id, name, email, specialty, is_online, role, created_at)
SELECT id, 'Michael Silva', 'michael.silva@startcup-amf.com', 'Avaliador', false, 'evaluator', NOW()
FROM auth.users
WHERE email = 'michael.silva@startcup-amf.com'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. ADD EVALUATOR: Bruna Leao
-- ============================================================================
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'bruna.leao@startcup-amf.com',
  crypt('BLEvaluator@2025!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"evaluator"}'::jsonb,
  false,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Add to evaluators table
INSERT INTO public.evaluators (id, name, email, specialty, is_online, role, created_at)
SELECT id, 'Bruna Leao', 'bruna.leao@startcup-amf.com', 'Avaliadora', false, 'evaluator', NOW()
FROM auth.users
WHERE email = 'bruna.leao@startcup-amf.com'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. UPDATE TEAM: Mosaico → Outsiders
-- ============================================================================
-- First, delete old Mosaico user if exists
DELETE FROM auth.users WHERE email = 'mosaico@startcup-amf.com';

-- Create new user for Outsiders team
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'outsiders@startcup-amf.com',
  crypt('Outsiders@9930!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"team"}'::jsonb,
  false,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Update team record
UPDATE public.teams
SET
  name = 'Outsiders',
  email = 'outsiders@startcup-amf.com'
WHERE name = 'Mosaico';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '✅ CHECKING RESULTS' AS status;

-- Check auth.users
SELECT '' AS blank;
SELECT '=== AUTH.USERS ===' AS check_type;
SELECT
  email,
  role,
  raw_app_meta_data,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email IN ('michael.silva@startcup-amf.com', 'bruna.leao@startcup-amf.com', 'outsiders@startcup-amf.com')
ORDER BY email;

-- Check evaluators
SELECT '' AS blank;
SELECT '=== PUBLIC.EVALUATORS ===' AS check_type;
SELECT
  name,
  email,
  specialty,
  role,
  created_at
FROM public.evaluators
WHERE email IN ('michael.silva@startcup-amf.com', 'bruna.leao@startcup-amf.com')
ORDER BY name;

-- Check team
SELECT '' AS blank;
SELECT '=== PUBLIC.TEAMS ===' AS check_type;
SELECT
  name,
  email,
  course,
  created_at
FROM public.teams
WHERE name = 'Outsiders' OR name = 'Mosaico'
ORDER BY name;

SELECT '✅ ALL OPERATIONS COMPLETED!' AS final_status;
