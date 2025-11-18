-- ============================================================================
-- DIAGNÓSTICO PROFUNDO: Verificar por que Realtime está CLOSED/CHANNEL_ERROR
-- ============================================================================

-- 1. Verificar se penalties está PUBLICADO para Realtime
SELECT 
  schemaname,
  tablename,
  'penalties is published' as status
FROM pg_publication_tables 
WHERE tablename = 'penalties';

-- 2. Se penalties NÃO aparecer acima, o problema é este!
-- Listar TODAS as tabelas publicadas
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Verificar configuração da publicação supabase_realtime
SELECT
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- 4. Verificar RLS policies ATUAIS na penalties
SELECT
  policyname,
  permissive,
  roles::text,
  qual
FROM pg_policies
WHERE tablename = 'penalties'
ORDER BY policyname;

-- 5. Verificar se há RESTRIÇÕES que bloqueiam SELECT
SELECT
  policyname,
  'BLOCKING SELECT' as issue
FROM pg_policies
WHERE tablename = 'penalties'
AND policyname LIKE '%read%'
AND qual::text NOT LIKE '%true%';
