-- ==========================================
-- DESABILITAR: Cron jobs que resetam evaluation_period_end_time
-- ==========================================
-- PROBLEMA IDENTIFICADO:
-- Jobs ativos rodando a cada minuto:
-- - Job 3: auto-start-next-quest-job (*/1 * * * *)
-- - Job 8: auto-advance-phase-job (*/1 * * * *)
--
-- Estes jobs chamam auto_advance_phase() repetidamente
-- auto_advance_phase() detecta "Fase 5 terminou, não há Fase 6"
-- E re-seta evaluation_period_end_time = NOW() + 20 minutos
-- RESULTADO: Timer reseta de 19min → 20min a cada execução
--
-- SOLUÇÃO:
-- DESABILITAR jobs 3 e 8 durante período de avaliação
-- ==========================================

-- Desabilitar auto-start-next-quest-job
UPDATE cron.job
SET active = false
WHERE jobid = 3;

-- Desabilitar auto-advance-phase-job  
UPDATE cron.job
SET active = false
WHERE jobid = 8;

SELECT '✅ Cron jobs 3 e 8 DESABILITADOS' as status;

-- Verificar:
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  CASE WHEN active THEN '🟢 ATIVO' ELSE '🔴 DESABILITADO' END as status
FROM cron.job
WHERE jobid IN (3, 8);

-- ==========================================
-- IMPORTANTE:
-- ==========================================
-- Após o evento terminar, você pode REABILITAR os jobs:
-- UPDATE cron.job SET active = true WHERE jobid IN (3, 8);
--
-- Mas durante o período de avaliação (20 min), 
-- eles DEVEM estar desabilitados para não resetar o timer.
-- ==========================================
