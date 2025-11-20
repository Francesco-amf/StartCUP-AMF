-- ==========================================
-- DESABILITAR: Trigger que reseta evaluation_period_end_time
-- ==========================================
-- PROBLEMA IDENTIFICADO:
-- - Trigger "start_evaluation_period_trigger" monitora event_config
-- - Quando event_end_time <= NOW() e evaluation_period_end_time IS NULL
-- - Ele SETA evaluation_period_end_time = NOW() + 15 minutos
-- - Mas auto_advance_phase() JÁ seta evaluation_period_end_time = NOW() + 20 minutos
-- - CONFLITO: Trigger sobrescreve o valor, resetando o timer
-- - RESULTADO: Timer volta de 19min para 20min
--
-- SOLUÇÃO:
-- - DESABILITAR o trigger start_evaluation_period_trigger
-- - Deixar apenas auto_advance_phase() controlar o evaluation_period_end_time
-- ==========================================

-- Desabilitar trigger
DROP TRIGGER IF EXISTS start_evaluation_period_trigger ON event_config;

-- Remover função (opcional, caso queira limpar completamente)
DROP FUNCTION IF EXISTS start_evaluation_period();

SELECT '✅ Trigger start_evaluation_period_trigger DESABILITADO' as status;

-- ==========================================
-- VERIFICAÇÃO
-- ==========================================
-- Confirmar que trigger não existe mais:
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'start_evaluation_period_trigger';
-- Deve retornar 0 rows

-- Ver triggers ativos em event_config:
SELECT 
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'event_config'
  AND t.tgisinternal = false;

-- ==========================================
-- EXPLICAÇÃO:
-- ==========================================
-- Agora apenas auto_advance_phase() controla evaluation_period_end_time
-- Quando Fase 5 termina:
--   1. auto_advance_phase() seta evaluation_period_end_time = NOW() + 20 min
--   2. NENHUM trigger vai sobrescrever esse valor
--   3. Timer decrementa corretamente de 20:00 → 0:00
-- ==========================================
