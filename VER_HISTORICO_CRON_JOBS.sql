-- 🔍 VER HISTÓRICO DE EXECUÇÃO DOS CRON JOBS
-- Isso mostra QUANDO e O QUE cada função fez

-- 1️⃣ Ver execuções de auto_advance_phase perto da transição Fase 1→2
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE command LIKE '%auto_advance_phase%'
  AND start_time >= '2025-11-22 03:20:00'
  AND start_time <= '2025-11-22 03:40:00'
ORDER BY start_time DESC;

-- 2️⃣ Ver execuções de auto_start_next_quest no mesmo período
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE command LIKE '%auto_start_next_quest%'
  AND start_time >= '2025-11-22 03:20:00'
  AND start_time <= '2025-11-22 03:40:00'
ORDER BY start_time DESC;

-- ============================================================================
-- O QUE PROCURAMOS:
-- ============================================================================
-- return_message mostra os RAISE NOTICE das funções
-- Isso vai revelar EXATAMENTE qual quest foi ativada e por qual função
-- 
-- Se auto_advance_phase ativou Quest 2.2, veremos no log
-- Se auto_start_next_quest ativou, também veremos
-- Se foi manual, NÃO vai aparecer nos logs
-- ============================================================================
