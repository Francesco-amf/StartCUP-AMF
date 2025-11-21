-- VERIFICAÇÃO COMPLETA DO PG_CRON
-- Executar no Supabase SQL Editor

-- 1. Verificar se pg_cron está instalado
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 2. Ver todos os jobs ativos
SELECT * FROM cron.job ORDER BY jobid;

-- 3. Ver histórico de execuções (últimas 50)
SELECT 
  runid,
  jobid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 50;

-- 4. Verificar se existe a função advance_to_next_phase
SELECT 
  routine_name,
  routine_type,
  routine_schema
FROM information_schema.routines
WHERE routine_name LIKE '%advance%'
ORDER BY routine_name;

-- 5. Verificar permissões da função
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%advance%'
  AND n.nspname = 'public';
