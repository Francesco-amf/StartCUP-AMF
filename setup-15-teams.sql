-- ============================================================================
-- SCRIPT: Criar 15 Equipes para StartCup AMF 2024
-- ============================================================================
-- Este script cria 15 usuários no Supabase Auth e seus respectivos times
-- Cada equipe tem uma senha única baseada no seu nome
--
-- IMPORTANTE: Antes de executar:
-- 1. Vá para Supabase Dashboard > SQL Editor
-- 2. Cole este script completo
-- 3. Execute (Ctrl+Enter ou clique em "Run")
-- 4. Guarde as credenciais abaixo em local seguro
--
-- AVISO: Este script usa a service role para criar usuários
-- Certifique-se de que tem permissões adequadas
-- ============================================================================

-- Função auxiliar para gerar hash de senha (usa função nativa do Supabase)
-- O Supabase cuida da hash automaticamente via trigger

-- Criar usuários e times
-- Cada linha cria um usuário no auth.users e um time na tabela teams

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
  'visionone@startcup.local',
  crypt('VisionOne@2024!', gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'),
  jsonb_build_object('role', 'team'),
  false,
  now(),
  now()
) ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('visionone@startcup.local', 'VisionOne', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 2. Código Sentencial (CS)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'codigosentencial@startcup.local', crypt('CodigoSentencial@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('codigosentencial@startcup.local', 'Código Sentencial (CS)', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 3. Smartcampus
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'smartcampus@startcup.local', crypt('Smartcampus@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('smartcampus@startcup.local', 'Smartcampus', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 4. Geração F
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'geracaof@startcup.local', crypt('GeracaoF@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('geracaof@startcup.local', 'Geração F', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 5. SparkUp
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sparkup@startcup.local', crypt('SparkUp@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('sparkup@startcup.local', 'SparkUp', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 6. Mistos.com
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mistoscom@startcup.local', crypt('Mistos.com@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('mistoscom@startcup.local', 'Mistos.com', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 7. Cogniverse
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'cogniverse@startcup.local', crypt('Cogniverse@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('cogniverse@startcup.local', 'Cogniverse', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 8. Os Notáveis
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'osnotaveis@startcup.local', crypt('OsNotaveis@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('osnotaveis@startcup.local', 'Os Notáveis', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 9. Turistando
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'turistando@startcup.local', crypt('Turistando@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('turistando@startcup.local', 'Turistando', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 10. S.Y.M.
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sym@startcup.local', crypt('S.Y.M.@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('sym@startcup.local', 'S.Y.M.', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 11. Gastroproject
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'gastroproject@startcup.local', crypt('Gastroproject@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('gastroproject@startcup.local', 'Gastroproject', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 12. MOVA
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mova@startcup.local', crypt('MOVA@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('mova@startcup.local', 'MOVA', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 13. Áurea Forma
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'aureaforma@startcup.local', crypt('AureaForma@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('aureaforma@startcup.local', 'Áurea Forma', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 14. Lumus
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'lumus@startcup.local', crypt('Lumus@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('lumus@startcup.local', 'Lumus', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 15. Mosaico
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mosaico@startcup.local', crypt('Mosaico@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('mosaico@startcup.local', 'Mosaico', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- ============================================================================
-- CREDENCIAIS DAS 15 EQUIPES
-- ============================================================================
-- Copie estas credenciais para um lugar seguro (Google Sheets, etc)
--
-- Equipe                    | Email                            | Senha
-- ========================================================================================
-- 1. VisionOne              | visionone@startcup.local         | VisionOne@2024!
-- 2. Código Sentencial (CS) | codigosentencial@startcup.local  | CodigoSentencial@2024!
-- 3. Smartcampus            | smartcampus@startcup.local       | Smartcampus@2024!
-- 4. Geração F              | geracaof@startcup.local          | GeracaoF@2024!
-- 5. SparkUp                | sparkup@startcup.local           | SparkUp@2024!
-- 6. Mistos.com             | mistoscom@startcup.local         | Mistos.com@2024!
-- 7. Cogniverse             | cogniverse@startcup.local        | Cogniverse@2024!
-- 8. Os Notáveis            | osnotaveis@startcup.local        | OsNotaveis@2024!
-- 9. Turistando             | turistando@startcup.local        | Turistando@2024!
-- 10. S.Y.M.                | sym@startcup.local               | S.Y.M.@2024!
-- 11. Gastroproject         | gastroproject@startcup.local     | Gastroproject@2024!
-- 12. MOVA                  | mova@startcup.local              | MOVA@2024!
-- 13. Áurea Forma           | aureaforma@startcup.local        | AureaForma@2024!
-- 14. Lumus                 | lumus@startcup.local             | Lumus@2024!
-- 15. Mosaico               | mosaico@startcup.local           | Mosaico@2024!
-- ========================================================================================
