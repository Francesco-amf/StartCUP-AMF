-- ============================================================================
-- FIX_BOSS_AUTO_ACTIVATION_SIMPLE.sql
-- ============================================================================
-- Propósito: BOSS ativa automaticamente quando quest anterior EXPIRA
-- Data: 22 Novembro 2025
-- Lógica: Quests sempre terminam no tempo delas (expiração)
--         BOSS ativa IMEDIATAMENTE após quest anterior expirar
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
  v_current_quest_id UUID;
  v_current_quest_expired BOOLEAN;
BEGIN
  -- ======================== PASSO 1: VERIFICAR FASE ======================
  SELECT current_phase INTO v_current_phase
  FROM event_config
  LIMIT 1;

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

  -- ============ PASSO 4: VERIFICAR SE QUEST ATUAL EXPIROU ===============
  SELECT q.id INTO v_current_quest_id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.order_index = v_current_quest_order;

  -- Verificar se expirou (passou o prazo + janela de atraso)
  SELECT EXISTS(
    SELECT 1 FROM quests q
    WHERE q.id = v_current_quest_id
      AND q.started_at IS NOT NULL
      AND q.duration_minutes IS NOT NULL
      AND NOW() > (
        q.started_at + 
        (q.duration_minutes * INTERVAL '1 minute') + 
        (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')
      )
  ) INTO v_current_quest_expired;

  -- Se não expirou ainda, aguardar
  IF NOT v_current_quest_expired THEN
    RAISE NOTICE '[auto_start] ⏳ Quest %.% ainda ativa (não expirou)', v_current_phase, v_current_quest_order;
    RETURN;
  END IF;

  -- ============= PASSO 5: ENCONTRAR PRÓXIMA QUEST ========================
  v_next_quest_order := v_current_quest_order + 1;

  IF v_next_quest_order > v_total_quests THEN
    RAISE NOTICE '[auto_start] 🏁 Fase % finalizada', v_current_phase;
    RETURN;
  END IF;

  -- Buscar ID da próxima quest
  SELECT q.id INTO v_quest_to_start_id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.order_index = v_next_quest_order;

  -- ========= PASSO 6: VERIFICAR SE JÁ FOI INICIADA =======================
  IF EXISTS (SELECT 1 FROM quests WHERE id = v_quest_to_start_id AND started_at IS NOT NULL) THEN
    RAISE NOTICE '[auto_start] ⚠️  Quest %.% já foi iniciada antes', v_current_phase, v_next_quest_order;
    RETURN;
  END IF;

  -- ========= PASSO 7: ✅ ATIVAR PRÓXIMA QUEST (INCLUINDO BOSS) ===========
  UPDATE quests
  SET started_at = NOW(),
      status = 'active'
  WHERE id = v_quest_to_start_id;

  -- Log especial se for BOSS (order_index = 4)
  IF v_next_quest_order = 4 THEN
    RAISE NOTICE '[auto_start] 🎯 BOSS %.% ATIVADO automaticamente!', v_current_phase, v_next_quest_order;
  ELSE
    RAISE NOTICE '[auto_start] ✅ Quest %.% ATIVADA com sucesso!', v_current_phase, v_next_quest_order;
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[auto_start] ❌ ERRO: %', SQLERRM;
  RAISE;
END;
$$;

-- ============================================================================
-- APLICAR AGORA
-- ============================================================================
SELECT 'Função auto_start_next_quest() atualizada - TODAS as quests (incluindo BOSS) ativam automaticamente quando anterior expira!' as status;

-- ============================================================================
-- Documentação:
-- ============================================================================
-- COMPORTAMENTO:
-- 
-- TODAS as Quests (1.1, 1.2, 1.3, BOSS 1.4):
--   - Ativam AUTOMATICAMENTE quando quest anterior EXPIRA
--   - Não importa se é BOSS ou quest normal
--   - Sistema verifica a cada minuto via cron job
-- 
-- Exemplo Timeline Fase 1:
--   14:00 - Quest 1.1 inicia (manual)
--   14:30 - Quest 1.1 expira → Quest 1.2 ATIVA automaticamente
--   15:10 - Quest 1.2 expira → Quest 1.3 ATIVA automaticamente  
--   15:40 - Quest 1.3 expira → BOSS 1.4 ATIVA automaticamente ✅
--   15:50 - BOSS 1.4 expira → Fase 1 termina
-- 
-- VANTAGENS:
--   ✅ Totalmente automático
--   ✅ Não precisa configurar horários
--   ✅ BOSS ativa igual às outras quests
--   ✅ Simples e confiável
-- ============================================================================
