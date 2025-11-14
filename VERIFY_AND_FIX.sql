-- ============================================================================
-- VERIFICAR E CORRIGIR: Status atual do Auth
-- ============================================================================

-- PASSO 1: Ver quantos usuários .local ainda existem
SELECT '========== DIAGNÓSTICO ATUAL ==========' as paso;
SELECT COUNT(*) as usuarios_local FROM auth.users WHERE email LIKE '%@startcup.local';
SELECT COUNT(*) as usuarios_com FROM auth.users WHERE email LIKE '%@startcup-amf.com';
SELECT COUNT(*) as equipes_local FROM public.teams WHERE email LIKE '%@startcup.local';
SELECT COUNT(*) as equipes_com FROM public.teams WHERE email LIKE '%@startcup-amf.com';

-- PASSO 2: Listar todos os .local users (para confirmar quais existem)
SELECT '========== USUARIOS .LOCAL QUE EXISTEM ==========' as paso;
SELECT email, created_at FROM auth.users WHERE email LIKE '%@startcup.local' ORDER BY email;

-- PASSO 3: Listar todos os .com users (para confirmar quais foram criados)
SELECT '========== USUARIOS .COM QUE EXISTEM ==========' as paso;
SELECT email, created_at FROM auth.users WHERE email LIKE '%@startcup-amf.com' ORDER BY email;

-- PASSO 4: Ver duplicatas (mesmo email com domínios diferentes)
SELECT '========== POSSÍVEIS DUPLICATAS ==========' as paso;
SELECT
  SPLIT_PART(email, '@', 1) as team_name,
  email,
  COUNT(*) as count
FROM auth.users
WHERE email LIKE '%startcup%'
GROUP BY SPLIT_PART(email, '@', 1), email
HAVING COUNT(*) > 1
ORDER BY team_name;

-- PASSO 5: Status final
SELECT '========== RECOMENDAÇÃO ==========' as paso;
SELECT CASE
  WHEN (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@startcup.local') > 0
  THEN '⚠️ AINDA HÁ USUÁRIOS .local! Execute DELETE_ALL_LOCAL_USERS_FORCE.sql'
  ELSE '✅ NENHUM USUÁRIO .local RESTANTE - Pronto para testar!'
END as status;
