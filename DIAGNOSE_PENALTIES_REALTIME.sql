-- ============================================================================
-- DIAGNÓSTICO COMPLETO: Por que penalties Realtime está falhando?
-- ============================================================================

-- Seção 1: Verificar RLS habilitado na tabela penalties
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'penalties';

-- Seção 2: Listar TODAS as RLS policies na tabela penalties
SELECT
  policyname,
  permissive,
  roles::text,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'penalties'
ORDER BY policyname;

-- Seção 3: Verificar se o trigger de broadcast existe e está ativo
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'penalties'
ORDER BY trigger_name;

-- Seção 4: Verificar se a função do trigger existe
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%broadcast%penalties%'
ORDER BY routine_name;

-- Seção 5: Verificar permissões na tabela penalties para diferentes roles
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'penalties'
ORDER BY grantee, privilege_type;

-- Seção 6: Verificar se penalties está publicada em supabase_realtime
SELECT
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE schemaname = 'public'
AND tablename = 'penalties'
ORDER BY pubname;

-- Seção 7: Verificar extensões Realtime instaladas
SELECT
  extname,
  extversion
FROM pg_extension
WHERE extname LIKE '%realtime%'
ORDER BY extname;

-- Seção 8: Teste direto - inserir uma penalidade dummy e ver se o trigger funciona
-- (Este é um teste não-destrutivo, usa uma transação que você pode fazer rollback)
BEGIN;

-- Primeiro, descobrir quais são os valores válidos de penalty_type
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
AND constraint_name LIKE '%penalty%';

-- Criar registro temporário com um penalty_type válido
INSERT INTO public.penalties (
  id,
  team_id,
  penalty_type,
  points_deduction,
  reason,
  assigned_by_admin,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.teams LIMIT 1),
  'rule_violation',
  10,
  'Diagnóstico - este registro será descartado',
  true,
  NOW()
);

-- Ver se foi inserido
SELECT COUNT(*) as penalty_count FROM public.penalties WHERE reason LIKE 'Diagnóstico%';

-- ROLLBACK para não deixar registro de teste
ROLLBACK;

-- Seção 9: Resumo final
SELECT '=== DIAGNÓSTICO REALTIME PENALTIES ===' AS titulo;
SELECT 'Se todos os checks passarem, o problema é na camada de aplicação cliente' AS nota;
