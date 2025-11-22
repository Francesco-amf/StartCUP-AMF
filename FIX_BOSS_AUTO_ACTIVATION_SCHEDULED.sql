-- ============================================================================
-- FIX_BOSS_AUTO_ACTIVATION_SCHEDULED.sql
-- ============================================================================
-- Propósito: BOSS ativa AUTOMATICAMENTE mas APENAS quando chega a HORA dele
-- Data: 22 Novembro 2025
-- Comportamento:
--   - Quests normais: Ativam quando quest anterior termina (comportamento atual)
--   - BOSS: Ativa APENAS quando NOW() >= planned_start_time (hora programada)
-- ============================================================================

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
  v_next_quest_deliverable_type TEXT;
  v_quest_to_start_order_index INT;
  v_current_quest_id UUID;
  v_current_quest_expired BOOLEAN;
  v_current_quest_submitted BOOLEAN;
  v_current_quest_finished BOOLEAN;
  v_phase_start_time TIMESTAMP WITH TIME ZONE;
  v_accumulated_duration_minutes INT;
  v_boss_scheduled_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- ======================== PASSO 1: VERIFICAR FASE ======================
  SELECT current_phase INTO v_current_phase
  FROM event_config
  LIMIT 1;

  -- Se evento não começou ou está em fase 0, sair
  IF v_current_phase IS NULL OR v_current_phase = 0 THEN
    RAISE NOTICE '[auto_start] 🚫 Evento não iniciado';
    RETURN;
  END IF;

  -- ======================== PASSO 2: CONTAR QUESTS =======================
  SELECT COUNT(*) INTO v_total_quests
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase;

  -- ===================== PASSO 3: ENCONTRAR QUEST ATUAL ===================
  SELECT MAX(q.order_index) INTO v_current_quest_order
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.started_at IS NOT NULL;

  IF v_current_quest_order IS NULL THEN
    RAISE NOTICE '[auto_start] 📭 Nenhuma quest iniciada na fase %', v_current_phase;
    RETURN;
  END IF;

  -- ============ PASSO 4: VERIFICAR SE QUEST ATUAL TERMINOU ===============
  SELECT q.id INTO v_current_quest_id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.order_index = v_current_quest_order;

  -- Verificar se expirou (com late submission window)
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

  -- Verificar se foi submetida por ALGUMA equipe
  SELECT EXISTS(
    SELECT 1 FROM submissions WHERE quest_id = v_current_quest_id
  ) INTO v_current_quest_submitted;

  v_current_quest_finished := v_current_quest_expired OR v_current_quest_submitted;

  -- Se quest ainda está em andamento, não fazer nada
  IF NOT v_current_quest_finished THEN
    RAISE NOTICE '[auto_start] ⏳ Quest %.% ainda ativa', v_current_phase, v_current_quest_order;
    RETURN;
  END IF;

  -- ============= PASSO 5: ENCONTRAR PRÓXIMA QUEST ========================
  v_next_quest_order := v_current_quest_order + 1;

  -- Se não há próxima quest, sair
  IF v_next_quest_order > v_total_quests THEN
    RAISE NOTICE '[auto_start] 🏁 Fase % finalizada', v_current_phase;
    RETURN;
  END IF;

  -- Buscar dados da próxima quest
  SELECT q.id, q.deliverable_type, q.order_index
  INTO v_quest_to_start_id, v_next_quest_deliverable_type, v_quest_to_start_order_index
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.order_index = v_next_quest_order;

  -- ========= PASSO 6: ✅ VALIDAÇÃO BOSS - ATIVAR APENAS NA HORA DELE =====
  -- Boss identificado por order_index = 4 ou deliverable_type = 'presentation'
  
  -- Verificar se é BOSS
  DECLARE
    v_is_boss BOOLEAN := FALSE;
  BEGIN
    -- Verificação 1: order_index = 4
    IF v_quest_to_start_order_index = 4 THEN
      v_is_boss := TRUE;
    END IF;

    -- Verificação 2: deliverable_type contém 'presentation'
    IF v_next_quest_deliverable_type IS NOT NULL THEN
      IF v_next_quest_deliverable_type ILIKE '%presentation%' THEN
        v_is_boss := TRUE;
      END IF;
      
      -- Tentar como JSON
      BEGIN
        IF (v_next_quest_deliverable_type::jsonb) ? 'presentation' THEN
          v_is_boss := TRUE;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;

    -- ✅ SE FOR BOSS: Calcular horário baseado em duração acumulada
    IF v_is_boss THEN
      -- Buscar quando a fase começou
      CASE v_current_phase
        WHEN 1 THEN SELECT phase_1_start_time INTO v_phase_start_time FROM event_config LIMIT 1;
        WHEN 2 THEN SELECT phase_2_start_time INTO v_phase_start_time FROM event_config LIMIT 1;
        WHEN 3 THEN SELECT phase_3_start_time INTO v_phase_start_time FROM event_config LIMIT 1;
        WHEN 4 THEN SELECT phase_4_start_time INTO v_phase_start_time FROM event_config LIMIT 1;
        WHEN 5 THEN SELECT phase_5_start_time INTO v_phase_start_time FROM event_config LIMIT 1;
      END CASE;

      -- Se fase não começou ainda, aguardar
      IF v_phase_start_time IS NULL THEN
        RAISE NOTICE '🛑 [auto_start] BOSS %.% aguarda início da fase', 
                     v_current_phase, v_next_quest_order;
        RETURN;
      END IF;

      -- Calcular soma das durações das quests ANTERIORES ao BOSS
      SELECT COALESCE(SUM(duration_minutes), 0) INTO v_accumulated_duration_minutes
      FROM quests q
      JOIN phases p ON q.phase_id = p.id
      WHERE p.order_index = v_current_phase
        AND q.order_index < v_next_quest_order;

      -- Horário programado do BOSS = início da fase + duração acumulada
      v_boss_scheduled_start := v_phase_start_time + (v_accumulated_duration_minutes * INTERVAL '1 minute');

      -- Se ainda não chegou a hora do BOSS
      IF NOW() < v_boss_scheduled_start THEN
        RAISE NOTICE '⏰ [auto_start] BOSS %.% aguarda horário: % (faltam % min)', 
                     v_current_phase, 
                     v_next_quest_order,
                     v_boss_scheduled_start,
                     ROUND(EXTRACT(EPOCH FROM (v_boss_scheduled_start - NOW())) / 60);
        RETURN;
      END IF;

      -- ✅ Chegou a hora do BOSS!
      RAISE NOTICE '🎯 [auto_start] BOSS %.% HORA CHEGOU! Ativando... (programado: %, agora: %)', 
                   v_current_phase, v_next_quest_order, v_boss_scheduled_start, NOW();
    END IF;
  END;

  -- ========= PASSO 7: VERIFICAR SE JÁ FOI INICIADA =======================
  IF EXISTS (SELECT 1 FROM quests WHERE id = v_quest_to_start_id AND started_at IS NOT NULL) THEN
    RAISE NOTICE '[auto_start] ⚠️  Quest %.% já foi iniciada antes', v_current_phase, v_next_quest_order;
    RETURN;
  END IF;

  -- ========= PASSO 8: ✅ ATIVAR PRÓXIMA QUEST =============================
  UPDATE quests
  SET started_at = NOW(),
      status = 'active'
  WHERE id = v_quest_to_start_id;

  RAISE NOTICE '[auto_start] ✅ Quest %.% ATIVADA com sucesso!', v_current_phase, v_next_quest_order;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[auto_start] ❌ ERRO: %', SQLERRM;
  RAISE;
END;
$$;

-- ============================================================================
-- APLICAR AGORA
-- ============================================================================
SELECT 'Função auto_start_next_quest() atualizada - BOSS agora ativa automaticamente baseado na DURAÇÃO das quests!' as status;

-- ============================================================================
-- Documentação:
-- ============================================================================
-- COMPORTAMENTO NOVO:
-- 
-- Quests Normais (1.1, 1.2, 1.3):
--   - Ativam IMEDIATAMENTE quando quest anterior termina
-- 
-- BOSS (1.4, 2.4, 3.4, 4.4):
--   - Calcula horário programado: phase_start_time + soma(duration das quests anteriores)
--   - Exemplo: Fase 1 começa 14:00, Quest 1.1=30min, 1.2=40min, 1.3=30min
--             BOSS 1.4 programado para: 14:00 + 100min = 15:40
--   - Se ainda não chegou a hora: AGUARDA
--   - Se chegou a hora: ATIVA AUTOMATICAMENTE
-- 
-- VANTAGENS:
--   ✅ Quest anterior pode terminar cedo sem ativar BOSS
--   ✅ BOSS ativa automaticamente na hora calculada
--   ✅ Não precisa configurar horário manualmente
--   ✅ Respeita a duração planejada de cada quest
-- ============================================================================
