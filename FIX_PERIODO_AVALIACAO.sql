-- ============================================================
-- SOLUÇÃO: Período de Avaliação Final Antes do Game Over
-- ============================================================
-- Garante que TODAS as submissões sejam avaliadas antes de
-- decretar vencedor, evitando "vencedor falso"
-- ============================================================

-- ============================================================
-- PARTE 1: Adicionar Colunas no event_config
-- ============================================================

-- Adicionar colunas para controlar período de avaliação
ALTER TABLE event_config
ADD COLUMN IF NOT EXISTS evaluation_period_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS all_submissions_evaluated BOOLEAN DEFAULT false;

COMMENT ON COLUMN event_config.evaluation_period_end_time IS 
'Timestamp do fim do período de avaliação (15 min após última quest). Durante esse período, aguarda-se que todas as submissões sejam avaliadas antes de decretar Game Over.';

COMMENT ON COLUMN event_config.all_submissions_evaluated IS 
'Flag indicando se TODAS as submissões foram avaliadas. Atualizado automaticamente por job cron a cada 30 segundos.';

-- ============================================================
-- PARTE 2: Função para Verificar Status das Avaliações
-- ============================================================

CREATE OR REPLACE FUNCTION check_all_submissions_evaluated()
RETURNS TABLE(
  total_submissions BIGINT,
  evaluated_submissions BIGINT,
  pending_submissions BIGINT,
  all_evaluated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_submissions,
    COUNT(*) FILTER (WHERE status = 'evaluated')::BIGINT as evaluated_submissions,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_submissions,
    (COUNT(*) FILTER (WHERE status = 'pending') = 0)::BOOLEAN as all_evaluated
  FROM submissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_all_submissions_evaluated() IS 
'Retorna estatísticas sobre o status das submissões. Usado para verificar se todas foram avaliadas antes de iniciar Game Over.';

-- Testar a função
-- SELECT * FROM check_all_submissions_evaluated();

-- ============================================================
-- PARTE 3: Trigger para Iniciar Período de Avaliação
-- ============================================================

CREATE OR REPLACE FUNCTION start_evaluation_period()
RETURNS TRIGGER AS $$
DECLARE
  v_has_pending BOOLEAN;
BEGIN
  -- Verificar se event_end_time acabou de ser atingido
  -- (transição de futuro para passado)
  IF NEW.event_end_time IS NOT NULL 
     AND OLD.event_end_time IS NOT NULL
     AND OLD.event_end_time > NOW() 
     AND NEW.event_end_time <= NOW() 
     AND NEW.evaluation_period_end_time IS NULL THEN
    
    -- Verificar se há submissões pendentes
    SELECT EXISTS(
      SELECT 1 FROM submissions WHERE status = 'pending'
    ) INTO v_has_pending;
    
    IF v_has_pending THEN
      -- Iniciar período de avaliação (15 minutos)
      NEW.evaluation_period_end_time := NOW() + INTERVAL '15 minutes';
      NEW.all_submissions_evaluated := false;
      
      RAISE NOTICE '⏳ [EVALUATION PERIOD] Iniciado às % (termina em %)', 
                   NOW(), NEW.evaluation_period_end_time;
      RAISE NOTICE '   Submissões pendentes detectadas. Aguardando avaliações...';
    ELSE
      -- Nenhuma pendente, pular direto para Game Over
      NEW.all_submissions_evaluated := true;
      
      RAISE NOTICE '✅ [EVALUATION PERIOD] Pulado - Todas as submissões já avaliadas';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS start_evaluation_period_trigger ON event_config;

CREATE TRIGGER start_evaluation_period_trigger
BEFORE UPDATE ON event_config
FOR EACH ROW
EXECUTE FUNCTION start_evaluation_period();

-- ============================================================
-- PARTE 4: Job Automático para Verificar Progresso
-- ============================================================

-- Job que verifica a cada 30 segundos se todas as submissões foram avaliadas
-- Se sim, atualiza flag all_submissions_evaluated = true

SELECT cron.schedule(
  'check-evaluations-complete',
  '*/30 * * * * *', -- A cada 30 segundos
  $$
    UPDATE event_config
    SET all_submissions_evaluated = (
      SELECT COUNT(*) FILTER (WHERE status = 'pending') = 0
      FROM submissions
    )
    WHERE evaluation_period_end_time IS NOT NULL
      AND NOW() < evaluation_period_end_time
      AND all_submissions_evaluated = false;
  $$
);

-- Verificar se o job foi criado
-- SELECT * FROM cron.job WHERE jobname = 'check-evaluations-complete';

-- ============================================================
-- PARTE 5: Função para Forçar Fim do Período (Se Necessário)
-- ============================================================

-- Função manual para pular período de avaliação e ir direto para Game Over
-- Usar apenas em emergências ou testes
CREATE OR REPLACE FUNCTION force_end_evaluation_period()
RETURNS void AS $$
BEGIN
  UPDATE event_config
  SET 
    all_submissions_evaluated = true,
    evaluation_period_end_time = NOW();
  
  RAISE NOTICE '⚠️ Período de avaliação FORÇADO a terminar manualmente';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION force_end_evaluation_period() IS 
'Força o fim do período de avaliação e permite que Game Over seja exibido, mesmo com submissões pendentes. Usar apenas em emergências.';

-- ============================================================
-- PARTE 6: View com Status do Período de Avaliação
-- ============================================================

CREATE OR REPLACE VIEW evaluation_period_status AS
SELECT 
  ec.event_ended,
  ec.event_end_time,
  ec.evaluation_period_end_time,
  ec.all_submissions_evaluated,
  
  -- Status atual
  CASE 
    WHEN ec.evaluation_period_end_time IS NULL THEN 'EVENTO_EM_ANDAMENTO'
    WHEN ec.all_submissions_evaluated = true THEN 'AVALIACOES_COMPLETAS'
    WHEN NOW() < ec.evaluation_period_end_time THEN 'EM_AVALIACAO'
    ELSE 'PERIODO_EXPIRADO'
  END as status,
  
  -- Tempo restante do período de avaliação
  CASE 
    WHEN ec.evaluation_period_end_time IS NOT NULL AND NOW() < ec.evaluation_period_end_time THEN
      EXTRACT(EPOCH FROM (ec.evaluation_period_end_time - NOW()))::INTEGER
    ELSE 0
  END as segundos_restantes,
  
  -- Estatísticas de submissões
  (SELECT COUNT(*) FROM submissions) as total_submissions,
  (SELECT COUNT(*) FROM submissions WHERE status = 'evaluated') as evaluated_submissions,
  (SELECT COUNT(*) FROM submissions WHERE status = 'pending') as pending_submissions,
  
  -- Percentual completo
  CASE 
    WHEN (SELECT COUNT(*) FROM submissions) > 0 THEN
      ROUND((SELECT COUNT(*) FROM submissions WHERE status = 'evaluated')::NUMERIC / 
            (SELECT COUNT(*) FROM submissions)::NUMERIC * 100, 1)
    ELSE 100
  END as percentual_avaliado

FROM event_config ec;

-- Testar a view
-- SELECT * FROM evaluation_period_status;

-- ============================================================
-- TESTE 4: Forçar Fim do Período (Emergência)
-- ============================================================

-- Usar em caso de emergência (avaliadores não terminaram a tempo)
-- SELECT force_end_evaluation_period();

-- Verificar que flag foi setada
-- SELECT all_submissions_evaluated FROM event_config;

-- ============================================================
-- MONITORAMENTO EM PRODUÇÃO
-- ============================================================

/*
-- Query para monitorar progresso em tempo real
SELECT 
  status as estado_atual,
  total_submissions as total,
  evaluated_submissions as avaliadas,
  pending_submissions as pendentes,
  percentual_avaliado as progresso,
  CASE 
    WHEN segundos_restantes > 0 THEN
      (segundos_restantes / 60)::TEXT || ' minutos restantes'
    ELSE
      'Período expirado'
  END as tempo
FROM evaluation_period_status;

-- Atualizar a cada 10 segundos (no psql):
-- \watch 10
*/

-- ============================================================
-- LIMPEZA (SE NECESSÁRIO)
-- ============================================================

/*
-- Remover job
SELECT cron.unschedule('check-evaluations-complete');

-- Remover trigger
DROP TRIGGER IF EXISTS start_evaluation_period_trigger ON event_config;
DROP FUNCTION IF EXISTS start_evaluation_period();

-- Remover função de verificação
DROP FUNCTION IF EXISTS check_all_submissions_evaluated();

-- Remover função de força
DROP FUNCTION IF EXISTS force_end_evaluation_period();

-- Remover view
DROP VIEW IF EXISTS evaluation_period_status;

-- Remover colunas
ALTER TABLE event_config
DROP COLUMN IF EXISTS evaluation_period_end_time,
DROP COLUMN IF EXISTS all_submissions_evaluated;
*/

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

/*
-- Conferir se tudo foi criado corretamente
SELECT 
  'Colunas adicionadas' as verificacao,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_config' 
    AND column_name = 'evaluation_period_end_time'
  ) as ok;

SELECT 
  'Função check_all_submissions_evaluated' as verificacao,
  EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'check_all_submissions_evaluated'
  ) as ok;

SELECT 
  'Trigger start_evaluation_period' as verificacao,
  EXISTS(
    SELECT 1 FROM pg_trigger WHERE tgname = 'start_evaluation_period_trigger'
  ) as ok;

SELECT 
  'Job check-evaluations-complete' as verificacao,
  EXISTS(
    SELECT 1 FROM cron.job WHERE jobname = 'check-evaluations-complete'
  ) as ok;

SELECT 
  'View evaluation_period_status' as verificacao,
  EXISTS(
    SELECT 1 FROM pg_views WHERE viewname = 'evaluation_period_status'
  ) as ok;

-- Se todos retornarem 'ok = true', a instalação foi bem-sucedida! ✅
*/
