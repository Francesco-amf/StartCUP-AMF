-- ============================================================================
-- DIAGNÓSTICO: Verificar triggers e policies na tabela quests
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor para investigar o problema
-- ============================================================================

-- PASSO 1: Listar TODOS os triggers na tabela quests
SELECT 'PASSO 1: Triggers na tabela quests' as step;

SELECT 
  tgname AS trigger_name,
  tgtype AS trigger_type,
  tgenabled AS is_enabled,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'quests'::regclass
AND tgisinternal = false
ORDER BY tgname;

-- PASSO 2: Listar RLS policies
SELECT 'PASSO 2: RLS Policies na tabela quests' as step;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'quests'
ORDER BY policyname;

-- PASSO 3: Verificar se RLS está habilitado
SELECT 'PASSO 3: Status RLS' as step;

SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname = 'quests';

-- PASSO 4: Listar constraints
SELECT 'PASSO 4: Constraints na tabela quests' as step;

SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'quests'
ORDER BY con.conname;

-- PASSO 5: SOLUÇÃO TEMPORÁRIA - Desabilitar RLS para service_role
SELECT 'PASSO 5: Verificando bypass de RLS para service_role' as step;

-- Esta query mostra se o service_role está configurado para bypass RLS
SELECT rolname, rolsuper, rolbypassrls
FROM pg_roles
WHERE rolname IN ('service_role', 'postgres', 'authenticator');

-- =============================================================================
-- SOLUÇÃO: Se o problema for RLS, executar este comando:
-- =============================================================================

-- Garantir que service_role pode bypassar RLS
-- ALTER ROLE service_role BYPASSRLS;

-- OU desabilitar RLS temporariamente (NÃO RECOMENDADO EM PRODUÇÃO)
-- ALTER TABLE quests DISABLE ROW LEVEL SECURITY;

SELECT 'Diagnóstico completo!' as status;
