-- ============================================================================
-- VERIFICAR SE REALTIME ESTÁ HABILITADO NO PROJETO
-- ============================================================================
-- Esta verificação simples mostra se o Realtime está ativo
-- ============================================================================

-- TESTE 1: Verificar se a extensão 'http' está ativa (necessária para Realtime)
SELECT
  extname as extension_name,
  extversion as version,
  extnamespace::regnamespace as namespace
FROM pg_extension
WHERE extname IN ('http', 'pgsodium', 'uuid-ossp')
ORDER BY extname;

-- TESTE 2: Verificar se a publicação 'supabase_realtime' existe
SELECT
  pubname as publication_name,
  puballtables as includes_all_tables,
  pubinsert,
  pubupdate,
  pubdelete,
  pubtruncate,
  pubviaroot
FROM pg_publication
ORDER BY pubname;

-- TESTE 3: Listar tabelas PUBLICADAS para Realtime
SELECT DISTINCT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- TESTE 4: Verificar se há schemas especiais para Realtime
SELECT
  nspname as schema_name
FROM pg_namespace
WHERE nspname LIKE '%realtime%' OR nspname LIKE '%pgsodium%'
ORDER BY nspname;

-- TESTE 5: Verificar permissões da role 'anon' (necessária para Realtime)
SELECT
  usename as role_name,
  usesuper as is_superuser,
  usecreatedb as can_create_db,
  usecanlogin as can_login
FROM pg_user
WHERE usename IN ('anon', 'authenticated', 'service_role')
ORDER BY usename;

-- TESTE 6: Resultados da verificação
SELECT '=== REALTIME STATUS CHECKLIST ===' as info;
SELECT 'If supabase_realtime publication exists above: ✅ Realtime can be enabled' as step1;
SELECT 'If target tables listed in "Listar tabelas PUBLICADAS": ✅ Tables are published' as step2;
SELECT 'If penalties, event_config, live_ranking in list: ✅ Key tables are published' as step3;
SELECT 'If anon role exists and has can_login=true: ✅ Anonymous access enabled' as step4;
SELECT '' as spacer;
SELECT 'If ANY of the above are missing: ❌ Realtime might not be working' as warning;
