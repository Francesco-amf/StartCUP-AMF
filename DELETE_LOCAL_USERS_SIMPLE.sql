-- ============================================================================
-- DELETE: Remove ALL users with .local domain (SEM DESABILITAR TRIGGERS)
-- ============================================================================
-- Este script remove TODOS os usuários com domínio @startcup.local
-- Sem tentar desabilitar triggers (que causa permission denied)
-- ============================================================================

-- PASSO 1: Deletar todas as equipes .local
DELETE FROM public.teams
WHERE email LIKE '%@startcup.local';

-- PASSO 2: Deletar todos os usuários .local
DELETE FROM auth.users
WHERE email LIKE '%@startcup.local';

-- PASSO 3: Verificar que foram deletados
SELECT COUNT(*) as usuarios_local_restantes FROM auth.users
WHERE email LIKE '%@startcup.local';

SELECT COUNT(*) as equipes_local_restantes FROM public.teams
WHERE email LIKE '%@startcup.local';

-- Resultado esperado: ambos devem ser 0

SELECT '✅ DELETADOS TODOS OS USUÁRIOS .local!' AS status;
SELECT '✅ Se a contagem acima é 0, tudo OK!' AS confirm;
