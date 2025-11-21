-- ============================================================================
-- FIX_BOSS_AUTO_ACTIVATION_FINAL.sql
-- ============================================================================
-- Propósito: Garantir que a função auto_start_next_quest() NUNCA ative boss
-- Data: 21 Novembro 2025
-- Status: CRÍTICO - Executar imediatamente antes do evento
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

  -- ========= PASSO 6: ✅ VALIDAÇÃO CRÍTICA - NÃO ATIVAR BOSS ===========
  -- Boss identificado por:
  -- 1. order_index = 4 (sempre quarta quest de cada fase)
  -- 2. deliverable_type contém 'presentation'

  -- Validação 1: Verificar order_index
  IF v_quest_to_start_order_index = 4 THEN
    RAISE NOTICE '🛑 [auto_start] BLOQUEADO: Quest %.% é BOSS (order_index=4) - NÃO SERÁ ATIVADA AUTOMATICAMENTE', 
                 v_current_phase, v_next_quest_order;
    RETURN;
  END IF;

  -- Validação 2: Verificar deliverable_type
  IF v_next_quest_deliverable_type IS NOT NULL THEN
    -- Caso 1: String contém 'presentation' (case-insensitive)
    IF v_next_quest_deliverable_type ILIKE '%presentation%' THEN
      RAISE NOTICE '🛑 [auto_start] BLOQUEADO: Quest %.% é BOSS (presentation type) - NÃO SERÁ ATIVADA AUTOMATICAMENTE', 
                   v_current_phase, v_next_quest_order;
      RETURN;
    END IF;
    
    -- Caso 2: Tentar parse como JSON e verificar se tem chave 'presentation'
    BEGIN
      IF (v_next_quest_deliverable_type::jsonb) ? 'presentation' THEN
        RAISE NOTICE '🛑 [auto_start] BLOQUEADO: Quest %.% é BOSS (JSON with presentation) - NÃO SERÁ ATIVADA AUTOMATICAMENTE', 
                     v_current_phase, v_next_quest_order;
        RETURN;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Não é JSON, ignorar e continuar
      NULL;
    END;
  END IF;

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
-- Documentação:
-- ============================================================================
-- Esta função é chamada pelo CRON job 'auto-start-next-quest-job' a cada minuto
-- 
-- Fluxo:
-- 1. Verifica se evento iniciou (current_phase > 0)
-- 2. Encontra a última quest iniciada
-- 3. Verifica se essa quest terminou (expirou ou foi submetida)
-- 4. Se terminou, encontra a próxima quest
-- 5. VALIDA SE NÃO É BOSS (ordem crítica de proteção)
-- 6. Se não for boss, ativa automaticamente
-- 7. Se for boss, RETORNA SEM ATIVAR (boss requer ativação manual do admin)
--
-- Boss é identificado por:
-- - order_index = 4 (sempre a quarta quest de cada fase)
-- - deliverable_type = 'presentation' ou JSON com chave 'presentation'
--
-- Logs de debug:
-- - Para ver os logs, abra a aba "Logs" do Supabase Edge Functions
-- - Cada ativação é logada com timestamp e detalhes
-- ============================================================================
