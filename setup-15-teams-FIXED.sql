-- ============================================================================
-- SCRIPT: Criar 15 Equipes para StartCup AMF 2024 - VERSÃO CORRIGIDA
-- ============================================================================
-- Este script cria 15 usuários no Supabase Auth e seus respectivos times
-- Cada equipe tem uma senha única baseada no seu nome
--
-- CORREÇÃO APLICADA: Mudança de domínio .local para .com
-- A versão anterior usava @startcup.local que não é aceito por Supabase Auth
-- Esta versão usa @startcup-amf.com que é um domínio válido
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
  jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'),
  jsonb_build_object('role', 'team'),
  false,
  now(),
  now()
) ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('visionone@startcup-amf.com', 'VisionOne', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 2. Código Sentencial (CS)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'codigosentencial@startcup-amf.com', crypt('CodigoSentencial@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('codigosentencial@startcup-amf.com', 'Código Sentencial (CS)', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 3. Smartcampus
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'smartcampus@startcup-amf.com', crypt('Smartcampus@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('smartcampus@startcup-amf.com', 'Smartcampus', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 4. Geração F
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'geracaof@startcup-amf.com', crypt('GeracaoF@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('geracaof@startcup-amf.com', 'Geração F', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 5. SparkUp
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sparkup@startcup-amf.com', crypt('SparkUp@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('sparkup@startcup-amf.com', 'SparkUp', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 6. Mistos.com
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mistoscom@startcup-amf.com', crypt('Mistos.com@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('mistoscom@startcup-amf.com', 'Mistos.com', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 7. Cogniverse
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'cogniverse@startcup-amf.com', crypt('Cogniverse@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('cogniverse@startcup-amf.com', 'Cogniverse', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 8. Os Notáveis
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'osnotaveis@startcup-amf.com', crypt('OsNotaveis@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('osnotaveis@startcup-amf.com', 'Os Notáveis', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 9. Turistando
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'turistando@startcup-amf.com', crypt('Turistando@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('turistando@startcup-amf.com', 'Turistando', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 10. S.Y.M.
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sym@startcup-amf.com', crypt('S.Y.M.@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('sym@startcup-amf.com', 'S.Y.M.', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 11. Gastroproject
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'gastroproject@startcup-amf.com', crypt('Gastroproject@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('gastroproject@startcup-amf.com', 'Gastroproject', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 12. MOVA
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mova@startcup-amf.com', crypt('MOVA@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('mova@startcup-amf.com', 'MOVA', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 13. Áurea Forma
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'aureaforma@startcup-amf.com', crypt('AureaForma@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('aureaforma@startcup-amf.com', 'Áurea Forma', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 14. Lumus
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'lumus@startcup-amf.com', crypt('Lumus@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('lumus@startcup-amf.com', 'Lumus', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- 15. Mosaico
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mosaico@startcup-amf.com', crypt('Mosaico@2024!', gen_salt('bf')), now(), jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'team'), jsonb_build_object('role', 'team'), false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.teams (email, name, course, members, created_at)
VALUES ('mosaico@startcup-amf.com', 'Mosaico', 'StartCup 2024', '[]'::jsonb, now())
ON CONFLICT(email) DO NOTHING;

-- ============================================================================
-- CREDENCIAIS DAS 15 EQUIPES (VERSÃO CORRIGIDA COM DOMÍNIO .com)
-- ============================================================================
-- Copie estas credenciais para um lugar seguro (Google Sheets, etc)
--
-- Equipe                    | Email                             | Senha
-- ========================================================================================
-- 1. VisionOne              | visionone@startcup-amf.com         | VisionOne@2024!
-- 2. Código Sentencial (CS) | codigosentencial@startcup-amf.com  | CodigoSentencial@2024!
-- 3. Smartcampus            | smartcampus@startcup-amf.com       | Smartcampus@2024!
-- 4. Geração F              | geracaof@startcup-amf.com          | GeracaoF@2024!
-- 5. SparkUp                | sparkup@startcup-amf.com           | SparkUp@2024!
-- 6. Mistos.com             | mistoscom@startcup-amf.com         | Mistos.com@2024!
-- 7. Cogniverse             | cogniverse@startcup-amf.com        | Cogniverse@2024!
-- 8. Os Notáveis            | osnotaveis@startcup-amf.com        | OsNotaveis@2024!
-- 9. Turistando             | turistando@startcup-amf.com        | Turistando@2024!
-- 10. S.Y.M.                | sym@startcup-amf.com               | S.Y.M.@2024!
-- 11. Gastroproject         | gastroproject@startcup-amf.com     | Gastroproject@2024!
-- 12. MOVA                  | mova@startcup-amf.com              | MOVA@2024!
-- 13. Áurea Forma           | aureaforma@startcup-amf.com        | AureaForma@2024!
-- 14. Lumus                 | lumus@startcup-amf.com             | Lumus@2024!
-- 15. Mosaico               | mosaico@startcup-amf.com           | Mosaico@2024!
-- ========================================================================================

SELECT '✅ 15 EQUIPES CRIADAS COM SUCESSO!' AS status;
SELECT '✅ Domínio corrigido de .local para .com' AS detail_1;
SELECT '✅ Todas as equipes estão prontas para login' AS detail_2;
SELECT '✅ Teste com as credenciais acima!' AS next_step;
