-- ============================================================================
-- Verificar a estrutura de auth.users e quais campos podem estar causando erro
-- ============================================================================

-- 1. Ver a estrutura da tabela
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Ver constraints e triggers
SELECT *
FROM information_schema.table_constraints
WHERE table_schema = 'auth' AND table_name = 'users';

-- 3. Ver triggers na tabela
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- 4. Ver um usuário que já existe para entender a estrutura
SELECT *
FROM auth.users
WHERE email LIKE '%@startcup-amf.com'
LIMIT 1;

-- 5. Verificar se há políticas RLS na tabela
SELECT *
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'auth';
