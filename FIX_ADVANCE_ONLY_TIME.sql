-- ============================================================================
-- CORRIGIR: Quest só avança quando EXPIRA POR TEMPO, não por submissão
-- 
-- Problema: 
--   v_current_quest_finished := v_current_quest_expired OR v_current_quest_submitted
--   Faz quest avançar quando alguma equipe submete, não apenas por prazo
-- 
-- Solução:
--   v_current_quest_finished := v_current_quest_expired
--   Quest só avança quando prazo EXPIRAR completamente
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
  v_current_quest_finished BOOLEAN;
BEGIN
  -- ======================== PASSO 1: VERIFICAR FASE ======================
  SELECT current_phase INTO v_current_phase
  FROM event_config
  LIMIT 1;

  IF v_current_phase IS NULL THEN
    RAISE NOTICE '[auto_start] ⚠️ Nenhuma fase configurada';
    RETURN;
  END IF;

  RAISE NOTICE '[auto_start] 🔍 Verificando Fase %', v_current_phase;

  -- Contar total de quests da fase atual
  SELECT COUNT(*) INTO v_total_quests
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase;

  IF v_total_quests = 0 THEN
    RAISE NOTICE '[auto_start] ❌ Nenhuma quest na Fase %', v_current_phase;
    RETURN;
  END IF;

  -- ======== PASSO 2: ENCONTRAR A QUEST ATUAL (última iniciada) ========
  SELECT MAX(q.order_index) INTO v_current_quest_order
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.status = 'active'
    AND q.started_at IS NOT NULL;

  IF v_current_quest_order IS NULL THEN
    -- Nenhuma quest ativa, verificar se primeira quest foi iniciada
    SELECT MAX(q.order_index) INTO v_current_quest_order
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_current_phase
      AND q.started_at IS NOT NULL;
  END IF;

  IF v_current_quest_order IS NULL THEN
    RAISE NOTICE '[auto_start] ⏳ Nenhuma quest iniciada na Fase %', v_current_phase;
    RETURN;
  END IF;

  RAISE NOTICE '[auto_start] 📍 Quest atual: %.%', v_current_phase, v_current_quest_order;

  -- ============ PASSO 3: VERIFICAR SE QUEST ATUAL TERMINOU ===============
  SELECT q.id INTO v_current_quest_id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.order_index = v_current_quest_order;

  -- ✅ CORREÇÃO: Verificar APENAS se expirou por TEMPO (não por submissão)
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

  -- ✅ REMOVIDO: Não verificar mais submissões
  -- Quest APENAS avança quando prazo expira, não quando há submissão
  v_current_quest_finished := v_current_quest_expired;

  RAISE NOTICE '[auto_start]   Quest %.% - Expirou por tempo?: %', 
               v_current_phase, v_current_quest_order, v_current_quest_expired;

  -- Se quest ainda está em andamento, não fazer nada
  IF NOT v_current_quest_finished THEN
    RAISE NOTICE '[auto_start] ⏳ Quest %.% ainda ativa (prazo não expirou)', 
                 v_current_phase, v_current_quest_order;
    RETURN;
  END IF;

  -- ============= PASSO 4: ENCONTRAR PRÓXIMA QUEST ========================
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

  -- ========= PASSO 5: ✅ VALIDAÇÃO CRÍTICA - NÃO ATIVAR BOSS ===========
  IF v_quest_to_start_order_index = 4 AND v_next_quest_deliverable_type LIKE '%presentation%' THEN
    RAISE NOTICE '[auto_start] 🚫 Próxima quest é BOSS (%.%) - NÃO ativar automaticamente',
                 v_current_phase, v_next_quest_order;
    RETURN;
  END IF;

  -- ========= PASSO 6: Verificar se já foi iniciada =====================
  IF EXISTS (SELECT 1 FROM quests WHERE id = v_quest_to_start_id AND started_at IS NOT NULL) THEN
    RAISE NOTICE '[auto_start] ⚠️ Quest %.% já foi iniciada antes', v_current_phase, v_next_quest_order;
    RETURN;
  END IF;

  -- ========= PASSO 7: ✅ ATIVAR PRÓXIMA QUEST ============================
  UPDATE quests
  SET started_at = NOW(),
      status = 'active'
  WHERE id = v_quest_to_start_id;

  RAISE NOTICE '[auto_start] ✅ Quest %.% ATIVADA (prazo anterior expirou)', 
               v_current_phase, v_next_quest_order;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[auto_start] ❌ ERRO: %', SQLERRM;
  RAISE;
END;
$$;

-- Verificar que foi criada
SELECT 'Função auto_start_next_quest() corrigida!' as status;
SELECT '✅ Quest só avança quando PRAZO EXPIRA (não mais por submissão)' as info;
