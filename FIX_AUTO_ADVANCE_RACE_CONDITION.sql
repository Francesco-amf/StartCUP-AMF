-- ==========================================
-- CORREÇÃO: Race Condition entre auto_advance_phase e auto_start_next_quest
-- ==========================================
-- PROBLEMA IDENTIFICADO:
-- 1. auto_advance_phase() avança fase E inicia Quest 1 da nova fase
-- 2. auto_start_next_quest() inicia próxima quest SEM verificar mudança de fase
-- 3. Ambas executam a cada 1 minuto (schedule: * * * * *)
-- 4. RESULTADO: Múltiplas quests ativas, timestamps inconsistentes, loop
--
-- SOLUÇÃO:
-- - auto_start_next_quest(): Adicionar verificação de mudança de fase
-- - Adicionar LOCKS para evitar execuções simultâneas
-- - Corrigir lógica de "quest atual terminada"
-- ==========================================

-- ==========================================
-- FUNÇÃO CORRIGIDA: auto_start_next_quest()
-- ==========================================
CREATE OR REPLACE FUNCTION auto_start_next_quest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_phase INT;
  v_current_quest_order INT;
  v_next_quest_order INT;
  v_total_quests INT;
  v_quest_to_start_id UUID;
  v_quest_already_started BOOLEAN;
BEGIN
  -- ✅ LOCK: Evitar execuções simultâneas
  PERFORM pg_advisory_lock(123456789);
  
  BEGIN
    -- Buscar fase atual
    SELECT current_phase INTO v_current_phase
    FROM event_config
    LIMIT 1;

    IF v_current_phase IS NULL THEN
      RAISE NOTICE 'Nenhuma fase configurada';
      PERFORM pg_advisory_unlock(123456789);
      RETURN;
    END IF;

    RAISE NOTICE '🔍 [auto_start_next_quest] Verificando Fase %', v_current_phase;

    -- Contar total de quests da fase atual
    SELECT COUNT(*) INTO v_total_quests
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_current_phase;

    -- ✅ CORREÇÃO 1: Encontrar última quest ATIVA (não apenas iniciada)
    -- Isso evita pegar quests de fases antigas que foram fechadas
    SELECT MAX(q.order_index) INTO v_current_quest_order
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_current_phase
      AND q.status = 'active'  -- ✅ MUDANÇA: apenas quests ATIVAS
      AND q.started_at IS NOT NULL;

    -- ✅ CORREÇÃO 2: Se não há quest ativa, verificar se há quest iniciada mas fechada
    IF v_current_quest_order IS NULL THEN
      SELECT MAX(q.order_index) INTO v_current_quest_order
      FROM quests q
      JOIN phases p ON q.phase_id = p.id
      WHERE p.order_index = v_current_phase
        AND q.started_at IS NOT NULL;
    END IF;

    IF v_current_quest_order IS NULL THEN
      RAISE NOTICE '⚠️ Nenhuma quest iniciada na Fase %', v_current_phase;
      PERFORM pg_advisory_unlock(123456789);
      RETURN;
    END IF;

    RAISE NOTICE '📍 Última quest na Fase %: Quest %', v_current_phase, v_current_quest_order;

    -- ✅ CORREÇÃO 3: Verificar se quest atual ainda está ATIVA
    DECLARE
      v_current_quest_id UUID;
      v_current_quest_status TEXT;
      v_current_quest_expired BOOLEAN;
      v_current_quest_submitted BOOLEAN;
      v_current_quest_finished BOOLEAN;
    BEGIN
      -- Buscar quest atual
      SELECT q.id, q.status INTO v_current_quest_id, v_current_quest_status
      FROM quests q
      JOIN phases p ON q.phase_id = p.id
      WHERE p.order_index = v_current_phase
        AND q.order_index = v_current_quest_order;

      -- Se status já é 'closed', quest já terminou
      IF v_current_quest_status = 'closed' THEN
        v_current_quest_finished := TRUE;
        RAISE NOTICE '  Status: closed (já finalizada)';
      ELSE
        -- Verificar expiração
        SELECT EXISTS(
          SELECT 1 FROM quests q
          WHERE q.id = v_current_quest_id
            AND q.started_at IS NOT NULL
            AND q.planned_deadline_minutes IS NOT NULL
            AND NOW() > (
              q.started_at + 
              (q.planned_deadline_minutes * INTERVAL '1 minute') + 
              (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')
            )
        ) INTO v_current_quest_expired;

        -- Verificar submissão
        SELECT EXISTS(
          SELECT 1 FROM submissions WHERE quest_id = v_current_quest_id
        ) INTO v_current_quest_submitted;

        v_current_quest_finished := v_current_quest_expired OR v_current_quest_submitted;

        RAISE NOTICE '  Expirou?: % | Submetida?: % | Finalizada?: %', 
                     v_current_quest_expired, v_current_quest_submitted, v_current_quest_finished;

        -- ✅ CORREÇÃO 4: Se terminou, fechar a quest
        IF v_current_quest_finished AND v_current_quest_status != 'closed' THEN
          UPDATE quests SET status = 'closed' WHERE id = v_current_quest_id;
          RAISE NOTICE '  ✅ Quest % marcada como closed', v_current_quest_order;
        END IF;
      END IF;

      -- Se não terminou, não iniciar próxima
      IF NOT v_current_quest_finished THEN
        RAISE NOTICE '⏳ Quest % ainda em andamento. Aguardando.', v_current_quest_order;
        PERFORM pg_advisory_unlock(123456789);
        RETURN;
      END IF;
    END;

    -- Quest terminou, calcular próxima
    v_next_quest_order := v_current_quest_order + 1;

    -- Verificar se existe próxima quest
    IF v_next_quest_order > v_total_quests THEN
      RAISE NOTICE '🏁 Quest % era a última da Fase %. auto_advance_phase() vai processar.', 
                   v_current_quest_order, v_current_phase;
      PERFORM pg_advisory_unlock(123456789);
      RETURN;
    END IF;

    -- Buscar próxima quest
    SELECT q.id, q.started_at IS NOT NULL 
    INTO v_quest_to_start_id, v_quest_already_started
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_current_phase
      AND q.order_index = v_next_quest_order;

    -- ✅ CORREÇÃO 5: Verificar se já foi iniciada
    IF v_quest_already_started THEN
      RAISE NOTICE '⚠️ Quest % já foi iniciada anteriormente', v_next_quest_order;
      PERFORM pg_advisory_unlock(123456789);
      RETURN;
    END IF;

    -- ✅ INICIAR PRÓXIMA QUEST
    UPDATE quests
    SET started_at = NOW(),
        status = 'active'
    WHERE id = v_quest_to_start_id;

    RAISE NOTICE '✅ Quest % da Fase % iniciada automaticamente!', v_next_quest_order, v_current_phase;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'ERRO em auto_start_next_quest: %', SQLERRM;
      PERFORM pg_advisory_unlock(123456789);
      RAISE;
  END;

  -- ✅ UNLOCK sempre ao final
  PERFORM pg_advisory_unlock(123456789);
END;
$$;

-- ==========================================
-- FUNÇÃO CORRIGIDA: auto_advance_phase()
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
        RAISE NOTICE '🏁 Fase % completa. Evento finalizado.', v_current_phase;
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
SELECT 'Funções corrigidas com sucesso!' as status;

-- Testar manualmente (opcional):
-- SELECT auto_start_next_quest();
-- SELECT auto_advance_phase();

-- ==========================================
-- PRÓXIMOS PASSOS:
-- ==========================================
-- 1. Execute este script no Supabase
-- 2. REATIVE os cron jobs no Dashboard:
--    - auto-start-next-quest-job
--    - auto-advance-phase-job
-- 3. Monitore os logs para verificar funcionamento
-- ==========================================
