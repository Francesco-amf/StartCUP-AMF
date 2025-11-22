-- 🔍 AUDITORIA COMPLETA DOS CRON JOBS

-- 1️⃣ VER TODOS OS CRON JOBS ATIVOS
SELECT 
  jobid as "ID",
  jobname as "Nome do Job",
  schedule as "Schedule (cron format)",
  command as "Comando SQL",
  nodename as "Node",
  nodeport as "Porta",
  database as "Database",
  username as "Usuário",
  active as "Ativo?",
  jobid as "Job ID"
FROM cron.job
ORDER BY jobname;

-- 2️⃣ VER HISTÓRICO DE EXECUÇÕES RECENTES (últimas 20)
SELECT 
  runid as "Run ID",
  jobid as "Job ID",
  job_pid as "Process ID",
  database as "DB",
  username as "User",
  command as "Comando",
  status as "Status",
  return_message as "Mensagem",
  start_time as "Início",
  end_time as "Fim",
  end_time - start_time as "Duração"
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;

-- 3️⃣ VER TIMEZONE DO SISTEMA
SELECT 
  current_setting('TIMEZONE') as "Timezone Config",
  NOW() as "NOW() UTC",
  NOW() AT TIME ZONE 'America/Sao_Paulo' as "NOW() Brasília (-03)",
  EXTRACT(TIMEZONE FROM NOW()) / 3600 as "Offset em horas";

-- 4️⃣ VERIFICAR QUAIS CRON JOBS VOCÊ TEM
-- Procurar especificamente pelos 3 que você mencionou
SELECT 
  jobname as "Nome",
  CASE 
    WHEN jobname LIKE '%auto-start%' THEN '🚀 Auto Start Next Quest'
    WHEN jobname LIKE '%auto-advance%' THEN '⏭️ Auto Advance Phase'
    WHEN jobname LIKE '%evaluation%' THEN '📝 Check Evaluation Period'
    ELSE '❓ Outro'
  END as "Tipo",
  schedule as "Quando Roda",
  active as "Ativo?",
  CASE 
    WHEN active THEN '✅ RODANDO'
    ELSE '❌ PARADO'
  END as "Status"
FROM cron.job
ORDER BY jobname;
