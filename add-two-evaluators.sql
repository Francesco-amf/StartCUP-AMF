-- ============================================================================
-- ADD TWO EVALUATORS: Michael Silva & Bruna Leao
-- ============================================================================
-- This script will:
-- 1) keep a small backup (temp table) of any existing auth.users rows for these emails
-- 2) INSERT the auth.users rows if they don't exist
-- 3) UPDATE existing auth.users rows that are missing an email provider to set
--    raw_app_meta_data -> {"provider":"email","providers":["email"]}
--    and set email_confirmed_at if NULL
-- 4) Insert corresponding rows into `evaluators` using the auth.users.id UUID
-- ============================================================================

BEGIN;

-- Backup any existing rows for safety
CREATE TEMP TABLE tmp_backup_auth_users AS
SELECT * FROM auth.users
WHERE email IN ('michael.silva@startcup-amf.com','bruna.leao@startcup-amf.com');

-- 1) Insert users if they do NOT exist yet
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
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  vals.email,
  crypt(vals.plain_password, gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"evaluator"}'::jsonb,
  false,
  now(),
  now()
FROM (VALUES
  ('michael.silva@startcup-amf.com','MSEvaluator@2025!'),
  ('bruna.leao@startcup-amf.com','BLEvaluator@2025!')
) AS vals(email, plain_password)
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = vals.email);

-- 2) Update any existing users that are missing the email provider OR have blank provider
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"provider":"email","providers":["email"]}'::jsonb,
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email IN ('michael.silva@startcup-amf.com','bruna.leao@startcup-amf.com')
  AND (raw_app_meta_data->>'provider' IS NULL OR raw_app_meta_data->>'provider' = '');

-- 3) Ensure evaluators table has a row for each user (using auth.users.id)
INSERT INTO evaluators (id, email, name, specialty, is_online)
SELECT u.id, u.email, v.name, NULL, false
FROM auth.users u
JOIN (VALUES
  ('michael.silva@startcup-amf.com','Michael Silva'),
  ('bruna.leao@startcup-amf.com','Bruna Leao')
) AS v(email, name) ON u.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM evaluators e WHERE e.id = u.id OR e.email = u.email);

COMMIT;

-- Verification
SELECT id, email, raw_app_meta_data->>'provider' AS provider, email_confirmed_at
FROM auth.users
WHERE email IN ('michael.silva@startcup-amf.com','bruna.leao@startcup-amf.com');

SELECT id, email, name, is_online FROM evaluators
WHERE email IN ('michael.silva@startcup-amf.com','bruna.leao@startcup-amf.com');

-- NOTES:
-- - This script uses `crypt()` + `gen_salt('bf')` to set an encrypted password compatible with
--   typical Postgres/pgcrypto setups (same pattern used elsewhere in repo).
-- - If your Supabase Auth has additional constraints or uses a different password hashing
--   strategy, prefer creating the users via Supabase Admin API or UI and then run just the
--   small UPDATE that adds provider metadata (so Auth and providers align).
-- - Run in Supabase SQL editor or via psql. Example (PowerShell):
--     psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE" -f .\add-two-evaluators.sql
