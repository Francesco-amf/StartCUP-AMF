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

-- Desabilitar auto-start-next-quest-job (jobid 3)
SELECT cron.unschedule(3);

-- Desabilitar auto-advance-phase-job (jobid 8)
SELECT cron.unschedule(8);

SELECT '✅ Cron jobs 3 e 8 REMOVIDOS' as status;

-- Verificar (não deve mostrar jobs 3 e 8):
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobid IN (3, 8);

-- ==========================================
-- IMPORTANTE:
-- ==========================================
-- Os jobs foram REMOVIDOS (unscheduled), não apenas desabilitados.
-- 
-- Se precisar recriá-los após o evento:
-- 
-- SELECT cron.schedule(
--   'auto-start-next-quest-job',
--   '* * * * *',  -- A cada minuto
--   'SELECT auto_start_next_quest();'
-- );
--
-- SELECT cron.schedule(
--   'auto-advance-phase-job',
--   '* * * * *',  -- A cada minuto
--   'SELECT auto_advance_phase();'
-- );
-- ==========================================
