-- ============================================================================
-- SCRIPT: Limpar Equipes com Domínio .local (Versão Antiga)
-- ============================================================================
-- Este script remove todos os usuários criados com o domínio @startcup.local
-- que causavam o erro 500 na autenticação.
--
-- Ele deve ser executado ANTES de executar setup-15-teams-FIXED.sql
-- ============================================================================

-- Passo 1: Remover equipas da tabela teams
DELETE FROM public.teams
WHERE email LIKE '%@startcup.local';

-- Passo 2: Remover usuários do auth.users com domínio .local
DELETE FROM auth.users
WHERE email LIKE '%@startcup.local';

-- Confirmação
SELECT COUNT(*) as usuarios_removidos FROM (
  SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email LIKE '%@startcup.local')
) AS verification;

SELECT '✅ Limpeza concluída!' AS status;
SELECT '✅ Todos os usuários com domínio .local foram removidos' AS detail_1;
SELECT '✅ Pronto para executar setup-15-teams-FIXED.sql' AS detail_2;
SELECT '⚠️ Certifique-se de deslogar qualquer sessão ativa antes de criar novas contas' AS warning;
