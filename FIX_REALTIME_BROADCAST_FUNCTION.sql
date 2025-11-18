-- ============================================================================
-- DESCOBRIR A FUNÇÃO CORRETA DO REALTIME
-- ============================================================================

-- Listar TODAS as funções no schema realtime
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'realtime'
ORDER BY routine_name;

-- Listar detalhes da função (se existir)
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'realtime'
ORDER BY p.proname;
