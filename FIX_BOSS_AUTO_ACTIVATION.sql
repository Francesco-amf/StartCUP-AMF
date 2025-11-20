-- ==================================================
-- CORREÇÃO: Impedir ativação automática de BOSS Quests
-- ==================================================
-- Data: 2025-11-20
-- Problema: Boss (Quest 2.4) ativa quando UMA equipe submete Quest 2.3
-- Solução: Modificar auto_start_next_quest() para PULAR Boss quests
-- ==================================================

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
BEGIN
  -- Buscar fase atual
  SELECT current_phase INTO v_current_phase
  FROM event_config
  LIMIT 1;

  IF v_current_phase IS NULL THEN
    RAISE NOTICE 'Nenhuma fase configurada';
    RETURN;
  END IF;

  RAISE NOTICE '🔍 Verificando quests da Fase %', v_current_phase;

  -- Contar total de quests da fase atual
  SELECT COUNT(*) INTO v_total_quests
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase;

  -- Encontrar a quest de maior order_index que já está ativa ou finalizada
  -- (última quest que foi iniciada)
  SELECT MAX(q.order_index) INTO v_current_quest_order
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.started_at IS NOT NULL;

  IF v_current_quest_order IS NULL THEN
    RAISE NOTICE '⚠️ Nenhuma quest iniciada na Fase %', v_current_phase;
    RETURN;
  END IF;

  RAISE NOTICE '📍 Última quest iniciada: Quest %', v_current_quest_order;

  -- Verificar se a quest atual já terminou (expirou OU foi submetida)
  DECLARE
    v_current_quest_finished BOOLEAN := FALSE;
    v_current_quest_id UUID;
    v_current_quest_expired BOOLEAN;
    v_current_quest_submitted BOOLEAN;
  BEGIN
    -- Buscar ID da quest atual
    SELECT q.id INTO v_current_quest_id
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_current_phase
      AND q.order_index = v_current_quest_order;

    -- Verificar se expirou
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

    -- Verificar se foi submetida
    SELECT EXISTS(
      SELECT 1 FROM submissions WHERE quest_id = v_current_quest_id
    ) INTO v_current_quest_submitted;

    v_current_quest_finished := v_current_quest_expired OR v_current_quest_submitted;

    RAISE NOTICE '  Expirou?: % | Submetida?: % | Finalizada?: %', 
                 v_current_quest_expired, v_current_quest_submitted, v_current_quest_finished;

    -- Se não terminou, não fazer nada
    IF NOT v_current_quest_finished THEN
      RAISE NOTICE '⏳ Quest % ainda em andamento. Aguardando.', v_current_quest_order;
      RETURN;
    END IF;
  END;

  -- Quest atual terminou, verificar próxima quest
  v_next_quest_order := v_current_quest_order + 1;

  -- Verificar se existe próxima quest na fase
  IF v_next_quest_order > v_total_quests THEN
    RAISE NOTICE '🏁 Quest % era a última da Fase %. Todas as quests finalizadas.', 
                 v_current_quest_order, v_current_phase;
    RETURN;
  END IF;

  -- Buscar ID e tipo da próxima quest
  SELECT q.id, q.deliverable_type INTO v_quest_to_start_id, v_next_quest_deliverable_type
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.order_index = v_next_quest_order;

  -- ✅ NOVA VALIDAÇÃO: Não ativar BOSS automaticamente
  -- Boss quests têm deliverable_type = 'presentation' ou array contendo 'presentation'
  IF v_next_quest_deliverable_type IS NOT NULL THEN
    -- Verificar se é JSON array ou string simples
    DECLARE
      v_is_boss BOOLEAN := FALSE;
    BEGIN
      -- Tentar como array JSON
      IF v_next_quest_deliverable_type::jsonb ? 'presentation' THEN
        v_is_boss := TRUE;
      -- Tentar como string simples
      ELSIF v_next_quest_deliverable_type = 'presentation' THEN
        v_is_boss := TRUE;
      -- Tentar como array PostgreSQL
      ELSIF v_next_quest_deliverable_type LIKE '%presentation%' THEN
        v_is_boss := TRUE;
      END IF;

      IF v_is_boss THEN
        RAISE NOTICE '🛑 Quest % é BOSS (presentation). Não será ativada automaticamente. Aguardando ativação manual.', v_next_quest_order;
        RETURN;
      END IF;
    END;
  END IF;

  -- Verificar se já foi iniciada
  IF EXISTS (SELECT 1 FROM quests WHERE id = v_quest_to_start_id AND started_at IS NOT NULL) THEN
    RAISE NOTICE '⚠️ Quest % já foi iniciada anteriormente', v_next_quest_order;
    RETURN;
  END IF;

  -- Iniciar próxima quest (se não for Boss)
  UPDATE quests
  SET started_at = NOW(),
      status = 'active'
  WHERE id = v_quest_to_start_id;

  RAISE NOTICE '✅ Quest % da Fase % iniciada automaticamente!', v_next_quest_order, v_current_phase;

END;
$$;

-- ==================================================
-- Aplicar correção imediatamente
-- ==================================================
SELECT 'Função auto_start_next_quest() corrigida para NÃO ativar Boss automaticamente!' as status;

-- ==================================================
-- Verificação
-- ==================================================
-- Execute o diagnóstico para verificar:
-- \i DIAGNOSE_BOSS_ATIVACAO_PREMATURA.sql
-- ==================================================
