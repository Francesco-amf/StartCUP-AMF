-- ==========================================
-- FIX: Sistema não avança após período de avaliação expirar
-- ==========================================
-- PROBLEMA:
-- - evaluation_period_end_time passou (era 09:45, agora são 09:48)
-- - event_ended ainda está FALSE
-- - Sistema está travado em estado "DESCONHECIDO"
--
-- CAUSA:
-- - auto_advance_phase() só SETA evaluation_period_end_time
-- - Mas não verifica se JÁ EXPIROU para avançar ao countdown final
--
-- SOLUÇÃO:
-- - Adicionar lógica para detectar período expirado
-- - Iniciar countdown final de 60 segundos
-- ==========================================

-- ==========================================
-- OPÇÃO 1: CORREÇÃO MANUAL (AGORA)
-- ==========================================
-- Se o período de avaliação JÁ PASSOU, força conclusão:

UPDATE event_config
SET 
  event_end_time = NOW() + INTERVAL '60 seconds',
  all_submissions_evaluated = true
WHERE 
  evaluation_period_end_time IS NOT NULL 
  AND NOW() > evaluation_period_end_time
  AND NOT event_ended;

SELECT 
  'Countdown final iniciado! Evento termina em 60 segundos' as status,
  event_end_time,
  (event_end_time - NOW()) as tempo_restante
FROM event_config;

-- ==========================================
-- OPÇÃO 2: ATUALIZAR auto_advance_phase() (DEFINITIVO)
-- ==========================================

CREATE OR REPLACE FUNCTION auto_advance_phase()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_phase INT;
  v_total_quests INT;
  v_completed_quests INT;
  v_submitted_quests INT;
  v_expired_quests INT;
  v_existing_evaluation_time TIMESTAMPTZ;
  v_evaluation_period_end TIMESTAMPTZ;
  v_event_end_time TIMESTAMPTZ;
  v_event_ended BOOLEAN;
BEGIN
  -- Lock para evitar execuções simultâneas
  IF NOT pg_try_advisory_lock(987654321) THEN
    RAISE NOTICE 'Outra instância já está executando. Ignorando...';
    RETURN;
  END IF;

  BEGIN
    SELECT current_phase, evaluation_period_end_time, event_end_time, event_ended
    INTO v_current_phase, v_evaluation_period_end, v_event_end_time, v_event_ended
    FROM event_config
    LIMIT 1;

    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 AUTO ADVANCE PHASE - Verificação';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fase atual: %', v_current_phase;
    RAISE NOTICE 'Período de avaliação: %', v_evaluation_period_end;
    RAISE NOTICE 'Fim do evento: %', v_event_end_time;
    RAISE NOTICE 'Evento terminado: %', v_event_ended;

    -- ==========================================
    -- NOVO: Verificar se período de avaliação expirou
    -- ==========================================
    IF v_evaluation_period_end IS NOT NULL AND NOW() > v_evaluation_period_end THEN
      IF v_event_end_time IS NULL OR NOW() > v_event_end_time THEN
        RAISE NOTICE '⏰ Período de avaliação expirou! Iniciando countdown final...';
        
        UPDATE event_config
        SET 
          event_end_time = NOW() + INTERVAL '60 seconds',
          all_submissions_evaluated = true
        WHERE evaluation_period_end_time IS NOT NULL;

        RAISE NOTICE '✅ Countdown final de 60 segundos iniciado!';
        RAISE NOTICE 'Evento terminará em: %', (NOW() + INTERVAL '60 seconds');
        
        PERFORM pg_advisory_unlock(987654321);
        RETURN;
      ELSE
        RAISE NOTICE '⏳ Aguardando countdown final terminar...';
        RAISE NOTICE 'Faltam: % segundos', EXTRACT(EPOCH FROM (v_event_end_time - NOW()));
        
        -- Se countdown final também expirou, marcar evento como terminado
        IF NOW() >= v_event_end_time AND NOT v_event_ended THEN
          RAISE NOTICE '🏁 EVENTO TERMINADO!';
          
          UPDATE event_config
          SET event_ended = true;
          
          PERFORM pg_advisory_unlock(987654321);
          RETURN;
        END IF;
        
        PERFORM pg_advisory_unlock(987654321);
        RETURN;
      END IF;
    END IF;

    -- ==========================================
    -- Proteção contra re-set do período de avaliação
    -- ==========================================
    SELECT evaluation_period_end_time INTO v_existing_evaluation_time
    FROM event_config LIMIT 1;

    IF v_existing_evaluation_time IS NOT NULL THEN
      RAISE NOTICE 'Período de avaliação já iniciado. Aguardando conclusão.';
      PERFORM pg_advisory_unlock(987654321);
      RETURN;
    END IF;

    -- ==========================================
    -- Lógica normal de avançar fases
    -- ==========================================
    SELECT COUNT(*)
    INTO v_total_quests
    FROM quests
    WHERE phase_id = (SELECT id FROM phases WHERE order_index = v_current_phase);

    SELECT COUNT(*)
    INTO v_completed_quests
    FROM quests
    WHERE phase_id = (SELECT id FROM phases WHERE order_index = v_current_phase)
      AND status = 'closed';

    SELECT COUNT(*)
    INTO v_submitted_quests
    FROM submissions
    WHERE quest_id IN (
      SELECT id FROM quests 
      WHERE phase_id = (SELECT id FROM phases WHERE order_index = v_current_phase)
    );

    SELECT COUNT(*)
    INTO v_expired_quests
    FROM quests
    WHERE phase_id = (SELECT id FROM phases WHERE order_index = v_current_phase)
      AND deadline < NOW()
      AND status = 'active';

    -- Fechar quests expiradas
    IF v_expired_quests > 0 THEN
      UPDATE quests
      SET status = 'closed'
      WHERE phase_id = (SELECT id FROM phases WHERE order_index = v_current_phase)
        AND deadline < NOW()
        AND status = 'active';
        
      RAISE NOTICE '🔒 % quests expiradas foram fechadas', v_expired_quests;
    END IF;

    -- Verificar se todas as quests estão completas
    IF (v_expired_quests + v_submitted_quests) >= v_total_quests THEN
      RAISE NOTICE '✅ Todas as % quests da Fase % processadas', v_total_quests, v_current_phase;
      
      -- Verificar se existe próxima fase
      IF EXISTS (SELECT 1 FROM phases WHERE order_index = v_current_phase + 1) THEN
        RAISE NOTICE '➡️ Avançando para Fase %', v_current_phase + 1;
        
        UPDATE event_config
        SET current_phase = v_current_phase + 1;
      ELSE
        RAISE NOTICE '🎯 Fase % foi a última fase!', v_current_phase;
        RAISE NOTICE '⏰ Iniciando período de avaliação de 20 minutos...';
        
        UPDATE event_config
        SET evaluation_period_end_time = NOW() + INTERVAL '20 minutes';
        
        RAISE NOTICE '✅ Período de avaliação terminará em: %', (NOW() + INTERVAL '20 minutes');
      END IF;
    ELSE
      RAISE NOTICE '⏳ Fase % ativa. Processadas: %/%', 
                   v_current_phase, 
                   (v_expired_quests + v_submitted_quests),
                   v_total_quests;
    END IF;
    
    RAISE NOTICE '========================================';

  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'ERRO em auto_advance_phase: %', SQLERRM;
      PERFORM pg_advisory_unlock(987654321);
      RAISE;
  END;

  PERFORM pg_advisory_unlock(987654321);
END;
$$;

-- ==========================================
-- TESTAR NOVA FUNÇÃO
-- ==========================================
SELECT auto_advance_phase();

-- Ver resultado:
SELECT 
  current_phase,
  evaluation_period_end_time,
  event_end_time,
  all_submissions_evaluated,
  event_ended,
  CASE 
    WHEN NOW() < evaluation_period_end_time THEN '⏳ PERÍODO DE AVALIAÇÃO'
    WHEN NOW() < event_end_time THEN '⏰ COUNTDOWN FINAL (60s)'
    WHEN event_ended THEN '🏁 EVENTO TERMINADO'
    ELSE '❓ ESTADO DESCONHECIDO'
  END as status_atual,
  (event_end_time - NOW()) as tempo_restante
FROM event_config;

-- ==========================================
-- EXPLICAÇÃO DA CORREÇÃO:
-- ==========================================
-- ANTES:
-- 1. auto_advance_phase() só SETAVA evaluation_period_end_time
-- 2. Não verificava se já tinha expirado
-- 3. Sistema ficava travado quando período passava
--
-- AGORA:
-- 1. Verifica se evaluation_period_end_time JÁ PASSOU
-- 2. Se passou E event_end_time é NULL → inicia countdown 60s
-- 3. Se countdown também passou → marca event_ended = true
-- 4. Frontend detecta mudanças e mostra UI apropriada
--
-- ESTADOS POSSÍVEIS:
-- - evaluation_period_end_time NULL → Fases normais
-- - evaluation_period_end_time definido, NOW() < fim → Countdown 20min
-- - event_end_time definido, NOW() < fim → Countdown 60s
-- - event_ended = true → GAME OVER, confetti, vencedor
-- ==========================================
