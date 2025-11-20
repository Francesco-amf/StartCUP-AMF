-- ==========================================
-- DIAGNÓSTICO: Por que timer reseta de 19min → 20min?
-- ==========================================

-- 1. Verificar TODOS os triggers em event_config
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'event_config'
  AND t.tgisinternal = false
ORDER BY t.tgname;

-- 2. Verificar se evaluation_period_end_time está sendo atualizado
-- Ver últimas modificações na tabela
SELECT 
  evaluation_period_end_time,
  event_end_time,
  all_submissions_evaluated,
  updated_at,
  (evaluation_period_end_time - NOW()) as tempo_restante
FROM event_config;

-- 3. Buscar TODAS as funções que modificam evaluation_period_end_time
SELECT 
  p.proname as function_name,
  p.prokind as kind
FROM pg_proc p
WHERE p.proname IN ('auto_advance_phase', 'start_evaluation_period', 'auto_start_next_quest')
ORDER BY p.proname;

-- 4. Verificar cron jobs ativos
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active,
  nodename
FROM cron.job
WHERE active = true;

-- 5. Histórico de UPDATEs (se audit log estiver ativo)
-- Ver se há algum processo atualizando evaluation_period_end_time repetidamente

-- 6. Verificar se auto_advance_phase está sendo chamado em loop
-- Adicionar log temporário
CREATE OR REPLACE FUNCTION log_evaluation_period_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.evaluation_period_end_time IS DISTINCT FROM NEW.evaluation_period_end_time THEN
    RAISE NOTICE '⚠️ [TRIGGER LOG] evaluation_period_end_time ALTERADO:';
    RAISE NOTICE '   ANTES: %', OLD.evaluation_period_end_time;
    RAISE NOTICE '   DEPOIS: %', NEW.evaluation_period_end_time;
    RAISE NOTICE '   STACK: %', pg_backend_pid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_evaluation_changes ON event_config;
CREATE TRIGGER log_evaluation_changes
  BEFORE UPDATE ON event_config
  FOR EACH ROW
  EXECUTE FUNCTION log_evaluation_period_changes();

SELECT 'Trigger de log criado. Verifique os logs do Supabase para ver quem está alterando evaluation_period_end_time' as status;
