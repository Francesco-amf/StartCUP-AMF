-- ==================================================
-- CORREÇÃO URGENTE: Parar auto-advance descontrolado
-- ==================================================

-- PASSO 1: DESABILITAR IMEDIATAMENTE o cron job
SELECT cron.unschedule('auto-advance-phase-job');

-- Verificar se foi removido:
SELECT * FROM cron.job WHERE jobname = 'auto-advance-phase-job';
-- Deve retornar 0 linhas

-- ==================================================
-- PASSO 2: Resetar para Fase 1 (se necessário)
-- ==================================================
-- CUIDADO: Só execute se quiser voltar para Fase 1

-- UPDATE event_config SET current_phase = 1;

-- ==================================================
-- PASSO 3: Analisar o problema
-- ==================================================
-- Execute o DEBUG_AUTO_ADVANCE.sql para entender o que está acontecendo

