-- ============================================================================
-- ADD NEW EVALUATORS AND UPDATE TEAM NAME
-- Run this via Supabase CLI: supabase sql < ADD_EVALUATORS_AND_UPDATE_TEAM.sql
-- ============================================================================

-- ============================================================================
-- 1. ADD EVALUATOR: Michael Silva
-- ============================================================================
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
)
VALUES (
  gen_random_uuid(),
  'michael.silva@startcup-amf.com',
  crypt('MSEvaluator@2025!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.evaluators (id, name, email, specialty, is_online, role)
SELECT id, 'Michael Silva', 'michael.silva@startcup-amf.com', 'Avaliador', false, 'evaluator'
FROM auth.users
WHERE email = 'michael.silva@startcup-amf.com';

-- ============================================================================
-- 2. ADD EVALUATOR: Bruna Leao
-- ============================================================================
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
)
VALUES (
  gen_random_uuid(),
  'bruna.leao@startcup-amf.com',
  crypt('BLEvaluator@2025!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.evaluators (id, name, email, specialty, is_online, role)
SELECT id, 'Bruna Leao', 'bruna.leao@startcup-amf.com', 'Avaliadora', false, 'evaluator'
FROM auth.users
WHERE email = 'bruna.leao@startcup-amf.com';

-- ============================================================================
-- 3. UPDATE TEAM: Mosaico → Outsiders
-- ============================================================================
-- First, create new auth user for Outsiders with the new password
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
)
VALUES (
  gen_random_uuid(),
  'outsiders@startcup-amf.com',
  crypt('Outsiders@9930!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated'
)
ON CONFLICT DO NOTHING;

-- Then update the team record
UPDATE public.teams
SET
  name = 'Outsiders',
  email = 'outsiders@startcup-amf.com'
WHERE name = 'Mosaico';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '✅ EVALUATORS ADDED:' AS status;
SELECT name, email FROM public.evaluators
WHERE email IN ('michael.silva@startcup-amf.com', 'bruna.leao@startcup-amf.com')
ORDER BY name;

SELECT '✅ TEAM UPDATED:' AS status;
SELECT name, email FROM public.teams
WHERE name = 'Outsiders';

SELECT '✅ ALL OPERATIONS COMPLETED!' AS final_status;
