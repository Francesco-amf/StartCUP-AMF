-- ⚡ REATIVAR auto-start-next-quest-job

-- 1️⃣ DELETAR O JOB PARADO
SELECT cron.unschedule('auto-start-next-quest-job');

-- 2️⃣ RECRIAR O JOB ATIVO
SELECT cron.schedule(
  'auto-start-next-quest-job',  -- Nome do job
  '* * * * *',                    -- A cada minuto (em UTC)
  'SELECT auto_start_next_quest();' -- Comando SQL
);

-- 3️⃣ CONFIRMAR QUE ESTÁ ATIVO
SELECT 
  jobname as "Nome",
  schedule as "Schedule",
  active as "Ativo?",
  CASE 
    WHEN active THEN '✅ ATIVADO COM SUCESSO!'
    ELSE '❌ AINDA PARADO'
  END as "Status"
FROM cron.job
WHERE jobname = 'auto-start-next-quest-job';

-- 4️⃣ VER STATUS DE TODOS OS 3 JOBS
SELECT 
  jobname as "Nome",
  schedule as "Quando Roda",
  active as "Ativo?",
  CASE 
    WHEN active THEN '✅ RODANDO'
    ELSE '❌ PARADO'
  END as "Status"
FROM cron.job
WHERE jobname IN ('auto-advance-phase-job', 'auto-start-next-quest-job', 'check-evaluations-complete')
ORDER BY jobname;

-- ============================================================================
-- EXPLICAÇÃO:
-- ============================================================================
-- O job auto-start-next-quest-job estava PARADO (active: false)
-- Por isso a Quest 2.2 só ativou 2h20min depois do esperado
-- 
-- Agora que reativamos:
-- - Roda a cada minuto (em UTC, mas não tem problema de timezone)
-- - Verifica se quest atual expirou
-- - Se sim, ativa próxima quest automaticamente
-- 
-- TIMELINE UTC (Supabase roda em UTC):
-- - Cron roda em UTC
-- - NOW() retorna UTC
-- - started_at armazenado em UTC (+00)
-- - Comparação funciona perfeitamente!
-- ============================================================================
