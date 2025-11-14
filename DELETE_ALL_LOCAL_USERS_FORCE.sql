-- ============================================================================
-- FORÇA MÁXIMA: Delete ALL users with .local domain
-- ============================================================================
-- Este script remove TODOS os usuários com domínio @startcup.local
-- Usa DELETE direto, sem WHERE, especificando cada email
-- ============================================================================

-- Disable triggers temporarily (if needed)
ALTER TABLE public.teams DISABLE TRIGGER ALL;
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- Delete all .local teams first
DELETE FROM public.teams WHERE email LIKE '%@startcup.local';
DELETE FROM public.teams WHERE email IN (
  'aureaforma@startcup.local',
  'codigosentencial@startcup.local',
  'cogniverse@startcup.local',
  'gastroproject@startcup.local',
  'geracaof@startcup.local',
  'lumus@startcup.local',
  'mistoscom@startcup.local',
  'mosaico@startcup.local',
  'mova@startcup.local',
  'osnotaveis@startcup.local',
  'smartcampus@startcup.local',
  'sparkup@startcup.local',
  'sym@startcup.local',
  'turistando@startcup.local',
  'visionone@startcup.local'
);

-- Delete all .local users from auth
DELETE FROM auth.users WHERE email LIKE '%@startcup.local';
DELETE FROM auth.users WHERE email IN (
  'aureaforma@startcup.local',
  'codigosentencial@startcup.local',
  'cogniverse@startcup.local',
  'gastroproject@startcup.local',
  'geracaof@startcup.local',
  'lumus@startcup.local',
  'mistoscom@startcup.local',
  'mosaico@startcup.local',
  'mova@startcup.local',
  'osnotaveis@startcup.local',
  'smartcampus@startcup.local',
  'sparkup@startcup.local',
  'sym@startcup.local',
  'turistando@startcup.local',
  'visionone@startcup.local'
);

-- Re-enable triggers
ALTER TABLE public.teams ENABLE TRIGGER ALL;
ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- Verify deletion
SELECT COUNT(*) as remaining_local_users FROM auth.users WHERE email LIKE '%@startcup.local';
SELECT COUNT(*) as remaining_local_teams FROM public.teams WHERE email LIKE '%@startcup.local';

SELECT '✅ TODOS OS USUÁRIOS .local FORAM DELETADOS!' AS status;
SELECT '✅ Verifique a contagem acima - deve ser 0 para ambos' AS verify;
