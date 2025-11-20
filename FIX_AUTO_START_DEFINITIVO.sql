-- ==================================================
-- SOLUÇÃO DEFINITIVA: auto_start_next_quest corrigido
-- ==================================================
-- Ativa próxima quest APENAS quando prazo da atual EXPIRAR
-- NÃO ativa baseado em submissões (permite submissões paralelas)
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

  -- Encontrar a quest de maior order_index que já está ativa
  SELECT MAX(q.order_index) INTO v_current_quest_order
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.status = 'active'
    AND q.started_at IS NOT NULL;

  IF v_current_quest_order IS NULL THEN
    RAISE NOTICE '⚠️ Nenhuma quest ativa na Fase %', v_current_phase;
    RETURN;
  END IF;

  RAISE NOTICE '📍 Quest ativa atual: Quest %', v_current_quest_order;

  -- ✅ NOVO: Verificar se a quest atual EXPIROU (prazo + janela de atraso)
  -- NÃO verificar submissões - permite múltiplas equipes trabalharem em paralelo
  DECLARE
    v_current_quest_expired BOOLEAN := FALSE;
    v_current_quest_id UUID;
  BEGIN
    -- Buscar ID da quest atual
    SELECT q.id INTO v_current_quest_id
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_current_phase
      AND q.order_index = v_current_quest_order;

    -- Verificar se EXPIROU (prazo + janela de atraso passou)
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

    RAISE NOTICE '  Quest expirou?: %', v_current_quest_expired;

    -- ✅ CORREÇÃO: Só avança se EXPIROU (não se foi submetida)
    IF NOT v_current_quest_expired THEN
      RAISE NOTICE '⏳ Quest % ainda no prazo. Aguardando expiração.', v_current_quest_order;
      RETURN;
    END IF;

    -- ✅ Quest expirou, marcar como closed
    UPDATE quests
    SET status = 'closed'
    WHERE id = v_current_quest_id
      AND status = 'active';

    RAISE NOTICE '🔒 Quest % expirou e foi marcada como closed', v_current_quest_order;
  END;

  -- Quest atual expirou, verificar próxima quest
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

  -- ✅ VALIDAÇÃO: Não ativar BOSS automaticamente
  IF v_next_quest_deliverable_type IS NOT NULL THEN
    DECLARE
      v_is_boss BOOLEAN := FALSE;
    BEGIN
      IF v_next_quest_deliverable_type::jsonb ? 'presentation' THEN
        v_is_boss := TRUE;
      ELSIF v_next_quest_deliverable_type = 'presentation' THEN
        v_is_boss := TRUE;
      ELSIF v_next_quest_deliverable_type LIKE '%presentation%' THEN
        v_is_boss := TRUE;
      END IF;

      IF v_is_boss THEN
        RAISE NOTICE '🛑 Quest % é BOSS. Não será ativada automaticamente.', v_next_quest_order;
        RETURN;
      END IF;
    END;
  END IF;

  -- Verificar se já foi iniciada
  IF EXISTS (SELECT 1 FROM quests WHERE id = v_quest_to_start_id AND started_at IS NOT NULL) THEN
    RAISE NOTICE '⚠️ Quest % já foi iniciada anteriormente', v_next_quest_order;
    RETURN;
  END IF;

  -- Iniciar próxima quest (apenas quando prazo anterior expirou)
  UPDATE quests
  SET started_at = NOW(),
      status = 'active'
  WHERE id = v_quest_to_start_id;

  RAISE NOTICE '✅ Quest % da Fase % iniciada automaticamente (prazo anterior expirou)!', v_next_quest_order, v_current_phase;

END;
$$;

-- ==================================================
-- Aplicar correção
-- ==================================================
SELECT 'Função auto_start_next_quest() corrigida!' as status;
SELECT 'Agora ativa próxima quest APENAS quando prazo expira (não quando equipes submetem)' as info;

-- ==================================================
-- REABILITAR o cron job
-- ==================================================
SELECT cron.schedule(
  'auto-start-next-quest-job',
  '* * * * *',
  'SELECT auto_start_next_quest();'
);

SELECT 'Cron job reabilitado com lógica corrigida' as status;
