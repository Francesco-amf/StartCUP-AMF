-- ==========================================
-- CORREÇÃO: auto_advance_phase() no final da Fase 5
-- ==========================================
-- PROBLEMA IDENTIFICADO:
-- Quando Fase 5 termina (todas quests completadas):
-- - auto_advance_phase() verifica: "Existe Fase 6?"
-- - NÃO existe Fase 6
-- - Função apenas dá RAISE NOTICE "Evento finalizado"
-- - MAS NÃO seta evaluation_period_end_time nem event_end_time
-- - RESULTADO: Live dashboard volta para Quest 5.1 zerada
--
-- SOLUÇÃO:
-- Quando Fase 5 termina, setar:
-- 1. evaluation_period_end_time = NOW() + 20 minutos
-- 2. event_end_time = evaluation_period_end_time + 60 segundos
-- 3. all_submissions_evaluated = FALSE (para mostrar período de avaliação)
-- ==========================================

CREATE OR REPLACE FUNCTION auto_advance_phase()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_phase INT;
  v_all_expired BOOLEAN;
  v_total_quests INT;
  v_expired_quests INT;
  v_submitted_quests INT;
  v_not_started_quests INT;
  v_next_phase INT;
  v_evaluation_end_time TIMESTAMP WITH TIME ZONE;
  v_event_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- ✅ LOCK: Evitar execuções simultâneas com auto_start_next_quest
  PERFORM pg_advisory_lock(987654321);

  BEGIN
    -- Buscar fase atual
    SELECT current_phase INTO v_current_phase
    FROM event_config
    LIMIT 1;

    IF v_current_phase IS NULL THEN
      RAISE NOTICE 'Nenhuma fase configurada';
      PERFORM pg_advisory_unlock(987654321);
      RETURN;
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE '[auto_advance_phase] Verificando Fase %', v_current_phase;

    -- Contar total de quests
    SELECT COUNT(*) INTO v_total_quests
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_current_phase;

    IF v_total_quests = 0 THEN
      RAISE NOTICE '⚠️ Fase % não possui quests', v_current_phase;
      PERFORM pg_advisory_unlock(987654321);
      RETURN;
    END IF;

    -- Contar não iniciadas
    SELECT COUNT(*) INTO v_not_started_quests
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_current_phase
      AND q.started_at IS NULL;

    -- Se há não iniciadas, aguardar
    IF v_not_started_quests > 0 THEN
      RAISE NOTICE '⏳ Fase % tem % quest(s) não iniciada(s). Aguardando.', 
                   v_current_phase, v_not_started_quests;
      PERFORM pg_advisory_unlock(987654321);
      RETURN;
    END IF;

    -- Contar expiradas
    SELECT COUNT(*) INTO v_expired_quests
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_current_phase
      AND q.started_at IS NOT NULL
      AND q.planned_deadline_minutes IS NOT NULL
      AND NOW() > (
        q.started_at + 
        (q.planned_deadline_minutes * INTERVAL '1 minute') + 
        (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')
      );

    -- Contar submetidas
    SELECT COUNT(DISTINCT q.id) INTO v_submitted_quests
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_current_phase
      AND EXISTS (SELECT 1 FROM submissions s WHERE s.quest_id = q.id);

    RAISE NOTICE 'Quests: total=% expiradas=% submetidas=%', 
                 v_total_quests, v_expired_quests, v_submitted_quests;

    -- Verificar se todas processadas
    v_all_expired := (v_expired_quests + v_submitted_quests) >= v_total_quests;

    IF v_all_expired THEN
      v_next_phase := v_current_phase + 1;

      -- Verificar se próxima fase existe
      IF EXISTS (SELECT 1 FROM phases WHERE order_index = v_next_phase) THEN
        RAISE NOTICE '✅ Todas quests processadas. Avançando Fase % → %', v_current_phase, v_next_phase;
        
        -- ✅ FECHAR todas quests da fase atual
        UPDATE quests
        SET status = 'closed'
        WHERE id IN (
          SELECT q.id FROM quests q
          JOIN phases p ON q.phase_id = p.id
          WHERE p.order_index = v_current_phase
            AND q.status != 'closed'
        );

        -- Atualizar event_config
        EXECUTE format(
          'UPDATE event_config 
           SET current_phase = $1,
               phase_%s_start_time = NOW(),
               updated_at = NOW()
           WHERE current_phase = $2',
          v_next_phase
        ) USING v_next_phase, v_current_phase;

        RAISE NOTICE '🎉 Fase atualizada. phase_%s_start_time setado.', v_next_phase;
        
        -- ✅ INICIAR Quest 1 da próxima fase
        UPDATE quests
        SET started_at = NOW(),
            status = 'active'
        WHERE id = (
          SELECT q.id
          FROM quests q
          JOIN phases p ON q.phase_id = p.id
          WHERE p.order_index = v_next_phase
            AND q.order_index = 1
          LIMIT 1
        );
        
        RAISE NOTICE '▶️ Quest 1 da Fase % iniciada', v_next_phase;
        
      ELSE
        -- ✅ CORREÇÃO PRINCIPAL: Não há próxima fase, setar fim do evento
        RAISE NOTICE '🏁 Fase % completa. Não há próxima fase. Iniciando período de avaliação.', v_current_phase;
        
        -- ✅ FECHAR todas quests da fase atual
        UPDATE quests
        SET status = 'closed'
        WHERE id IN (
          SELECT q.id FROM quests q
          JOIN phases p ON q.phase_id = p.id
          WHERE p.order_index = v_current_phase
            AND q.status != 'closed'
        );
        
        -- Calcular timestamps
        -- Período de avaliação: 20 minutos
        -- Countdown final: 60 segundos
        v_evaluation_end_time := NOW() + INTERVAL '20 minutes';
        v_event_end_time := v_evaluation_end_time + INTERVAL '60 seconds';
        
        -- ✅ SETAR event_end_time e evaluation_period_end_time
        UPDATE event_config
        SET evaluation_period_end_time = v_evaluation_end_time,
            event_end_time = v_event_end_time,
            all_submissions_evaluated = FALSE,
            updated_at = NOW()
        WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
        
        RAISE NOTICE '⏰ Período de avaliação: % → %', NOW(), v_evaluation_end_time;
        RAISE NOTICE '⏰ Evento terminará em: %', v_event_end_time;
        RAISE NOTICE '✅ Timestamps setados. Live dashboard vai mostrar período de avaliação.';
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
-- VERIFICAÇÃO
-- ==========================================
SELECT 'Função auto_advance_phase() corrigida!' as status;

-- Testar (se Fase 5 já terminou, vai setar os timestamps):
-- SELECT auto_advance_phase();

-- Ver resultado:
SELECT 
  current_phase,
  evaluation_period_end_time,
  event_end_time,
  all_submissions_evaluated,
  event_ended
FROM event_config;

-- ==========================================
-- PRÓXIMOS PASSOS:
-- ==========================================
-- 1. Execute este script no Supabase
-- 2. Se Fase 5 já terminou, execute manualmente:
--    SELECT auto_advance_phase();
-- 3. Verifique que evaluation_period_end_time foi setado
-- 4. Live dashboard deve mostrar countdown de 20 minutos
-- ==========================================
