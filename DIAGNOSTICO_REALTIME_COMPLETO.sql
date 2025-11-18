-- ============================================================================
-- DIAGNÓSTICO COMPLETO DO SISTEMA REALTIME
-- Verifica: RLS Policies, Realtime Triggers, Permissões, e Configuração
-- ============================================================================

-- ============================================================================
-- SEÇÃO 1: Verificar RLS habilitado em tabelas críticas
-- ============================================================================
-- Note: live_ranking is a VIEW, not a table - views inherit RLS from base tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('penalties', 'teams', 'event_config', 'quests')
ORDER BY tablename;

-- ============================================================================
-- SEÇÃO 2: Listar TODAS as RLS policies na tabela 'penalties'
-- ============================================================================
SELECT
  policyname,
  permissive,
  roles::text,
  qual as policy_condition,
  with_check
FROM pg_policies
WHERE tablename = 'penalties'
ORDER BY policyname;

-- ============================================================================
-- SEÇÃO 3: Verificar se há políticas que permitem Realtime
-- (Realtime precisa de SELECT access nas tabelas base)
-- ============================================================================
SELECT
  policyname,
  tablename,
  roles::text,
  qual as policy_condition
FROM pg_policies
WHERE tablename IN ('penalties', 'event_config', 'teams')
AND (qual::text LIKE '%anon%' OR qual::text LIKE '%authenticated%')
ORDER BY tablename, policyname;

-- ============================================================================
-- SEÇÃO 4: Verificar permissões da função 'realtime'
-- ============================================================================
SELECT
  grantor,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name IN ('penalties', 'live_ranking', 'event_config')
AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY table_name, grantee;

-- ============================================================================
-- SEÇÃO 5: Listar triggers na tabela 'penalties' (particularmente Realtime)
-- ============================================================================
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'penalties'
ORDER BY trigger_name;

-- ============================================================================
-- SEÇÃO 6: Verificar quais tabelas estão nas publicações (para Realtime)
-- ============================================================================
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- SEÇÃO 7: Contar registros na tabela penalties para verificar dados
-- ============================================================================
SELECT COUNT(*) as total_penalties FROM public.penalties;
SELECT COUNT(*) as total_teams FROM public.teams;
SELECT * FROM public.event_config LIMIT 1;

-- ============================================================================
-- SEÇÃO 8: Verificar status das publicações Realtime
-- ============================================================================
SELECT
  pubname as publication_name,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete,
  pubtruncate,
  pubviaroot
FROM pg_publication
WHERE pubname IN ('supabase_realtime', 'supabase_realtime_updates')
ORDER BY pubname;

-- ============================================================================
-- SEÇÃO 9: Verificar tipos de tabela/view
-- ============================================================================
SELECT
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('live_ranking', 'penalties', 'event_config', 'teams')
ORDER BY table_name;
