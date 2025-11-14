-- ============================================================================
-- FIX COMPLETO: Recria usuários .com com Email Provider configurado
-- ============================================================================
-- O problema: Users foram criados SEM o Email provider
-- A solução: Deletar os .local, deletar os .com com problemas, e recriar com provider
-- ============================================================================

-- PASSO 1: Deletar TODOS os usuarios .local (não funcionam mesmo)
DELETE FROM public.teams WHERE email LIKE '%@startcup.local';
DELETE FROM auth.users WHERE email LIKE '%@startcup.local';

-- PASSO 2: Deletar os .com que foram criados SEM provider correto
-- Vamos deletar e recriar com as configurações corretas
DELETE FROM public.teams WHERE email LIKE '%@startcup-amf.com';
DELETE FROM auth.users WHERE email LIKE '%@startcup-amf.com';

-- PASSO 3: Recriar todos os 15 usuarios com Email provider CORRETO
-- O segredo: raw_app_meta_data DEVE ter "providers": ["email"]

-- 1. VisionOne
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
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'visionone@startcup-amf.com',
  crypt('VisionOne@2024!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"team"}'::jsonb,
  false,
  now(),
  now()
) ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('visionone@startcup-amf.com', 'VisionOne', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 2. Código Sentencial
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'codigosentencial@startcup-amf.com', crypt('CodigoSentencial@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('codigosentencial@startcup-amf.com', 'Código Sentencial (CS)', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 3. Smartcampus
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'smartcampus@startcup-amf.com', crypt('Smartcampus@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('smartcampus@startcup-amf.com', 'Smartcampus', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 4. Geração F
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'geracaof@startcup-amf.com', crypt('GeracaoF@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('geracaof@startcup-amf.com', 'Geração F', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 5. SparkUp
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sparkup@startcup-amf.com', crypt('SparkUp@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('sparkup@startcup-amf.com', 'SparkUp', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 6. Mistos.com
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mistoscom@startcup-amf.com', crypt('Mistos.com@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('mistoscom@startcup-amf.com', 'Mistos.com', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 7. Cogniverse
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'cogniverse@startcup-amf.com', crypt('Cogniverse@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('cogniverse@startcup-amf.com', 'Cogniverse', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 8. Os Notáveis
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'osnotaveis@startcup-amf.com', crypt('OsNotaveis@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('osnotaveis@startcup-amf.com', 'Os Notáveis', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 9. Turistando
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'turistando@startcup-amf.com', crypt('Turistando@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('turistando@startcup-amf.com', 'Turistando', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 10. S.Y.M.
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sym@startcup-amf.com', crypt('S.Y.M.@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('sym@startcup-amf.com', 'S.Y.M.', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 11. Gastroproject
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'gastroproject@startcup-amf.com', crypt('Gastroproject@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('gastroproject@startcup-amf.com', 'Gastroproject', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 12. MOVA
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mova@startcup-amf.com', crypt('MOVA@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('mova@startcup-amf.com', 'MOVA', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 13. Áurea Forma
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'aureaforma@startcup-amf.com', crypt('AureaForma@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('aureaforma@startcup-amf.com', 'Áurea Forma', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 14. Lumus
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'lumus@startcup-amf.com', crypt('Lumus@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('lumus@startcup-amf.com', 'Lumus', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 15. Mosaico
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mosaico@startcup-amf.com', crypt('Mosaico@2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"team"}'::jsonb, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('mosaico@startcup-amf.com', 'Mosaico', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

SELECT '✅ TODOS OS USUÁRIOS RECRIADOS COM EMAIL PROVIDER!' AS status;
SELECT COUNT(*) as usuarios_com FROM auth.users WHERE email LIKE '%@startcup-amf.com';
SELECT COUNT(*) as usuarios_local_restantes FROM auth.users WHERE email LIKE '%@startcup.local';
SELECT COUNT(*) as usuarios_com_provider FROM auth.users WHERE email LIKE '%@startcup-amf.com' AND raw_app_meta_data->>'provider' = 'email';

SELECT '✅ Pronto para testar login!' AS next_action;
