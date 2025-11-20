-- ==========================================
-- RECRIAR: Cron jobs para próximo evento
-- ==========================================
-- Use este script para RECRIAR os cron jobs que foram removidos
-- durante o período de avaliação do evento.
--
-- Execute APENAS quando:
-- 1. O evento atual terminou completamente
-- 2. Você resetou o sistema para um novo evento
-- 3. Quer que as quests avancem automaticamente novamente
-- ==========================================

-- Job 3: Auto-start next quest (avança quests automaticamente)
SELECT cron.schedule(
  'auto-start-next-quest-job',  -- Nome do job
  '* * * * *',                   -- Schedule: a cada minuto
  'SELECT auto_start_next_quest();'  -- Comando
);

-- Job 8: Auto-advance phase (avança fases automaticamente)
SELECT cron.schedule(
  'auto-advance-phase-job',     -- Nome do job
  '* * * * *',                   -- Schedule: a cada minuto
  'SELECT auto_advance_phase();' -- Comando
);

SELECT '✅ Cron jobs recriados para próximo evento' as status;

-- Verificar jobs criados:
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname IN ('auto-start-next-quest-job', 'auto-advance-phase-job');

-- ==========================================
-- IMPORTANTE:
-- ==========================================
-- Estes jobs farão com que:
-- - Quests iniciem automaticamente quando deadline anterior expirar
-- - Fases avancem automaticamente quando todas quests terminarem
--
-- Durante período de avaliação (20 min), eles causam problema
-- porque tentam avançar além da Fase 5, resetando o timer.
--
-- Solução para eventos futuros:
-- Modificar auto_advance_phase() para NÃO re-setar 
-- evaluation_period_end_time se ele já estiver setado.
-- ==========================================
