-- ============================================================================
-- SOLUÇÃO: Desabilitar trigger que conflita com advance-quest endpoint
-- ============================================================================
-- O endpoint já está setando evaluation_period_end_time corretamente,
-- mas o trigger automático pode estar interferindo
-- ============================================================================

-- PASSO 1: Ver triggers ativos em event_config
SELECT 'PASSO 1: Triggers em event_config' as "===";
SELECT
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'event_config'
ORDER BY trigger_name;

-- PASSO 2: Desabilitar trigger que pode estar conflitando
SELECT 'PASSO 2: Desabilitando trigger automático' as "===";
ALTER TABLE event_config DISABLE TRIGGER start_evaluation_period_trigger;
SELECT 'Trigger start_evaluation_period_trigger desabilitado!' as resultado;

-- PASSO 3: Verificar que foi desabilitado
SELECT 'PASSO 3: Verificação' as "===";
SELECT
  trigger_name,
  CASE WHEN tgenabled = false THEN '✅ DESABILITADO' ELSE '❌ ATIVO' END as status
FROM pg_trigger
WHERE tgrelid = (SELECT oid FROM pg_class WHERE relname = 'event_config')
AND tgname = 'start_evaluation_period_trigger';

-- PASSO 4: Verificar se evaluation_period_end_time está corretamente setado
SELECT 'PASSO 4: Status atual de evaluation_period_end_time' as "===";
SELECT
  evaluation_period_end_time,
  all_submissions_evaluated,
  event_end_time,
  event_ended,
  NOW() as hora_atual,
  CASE WHEN evaluation_period_end_time IS NOT NULL THEN
    (evaluation_period_end_time - NOW()) AS tempo_restante
  ELSE NULL END as tempo_restante_hms
FROM event_config;

-- PASSO 5: Se tudo está NULL, resetar manualmente
SELECT 'PASSO 5: Se preciso resetar (fase de teste)' as "===";
-- Descomente linha abaixo se quiser resetar tudo para testar de novo:
-- UPDATE event_config SET
--   event_ended = false,
--   event_end_time = NULL,
--   evaluation_period_end_time = NULL,
--   all_submissions_evaluated = false;

SELECT 'Script executado com sucesso!' as resultado;
