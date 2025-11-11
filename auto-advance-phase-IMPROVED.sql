-- ==================================================
-- AUTO-ADVANCE PHASE SYSTEM - VERSÃO MELHORADA
-- ==================================================
-- MELHORIA: Fecha automaticamente quests expiradas
--           Inicia próxima quest quando a atual expira
--           Permite fluxo totalmente automático
-- ==================================================

-- PASSO 1: Remover função antiga (se existir)
DROP FUNCTION IF EXISTS auto_advance_phase();

-- PASSO 2: Criar função MELHORADA
CREATE OR REPLACE FUNCTION auto_advance_phase()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_phase INT;
  v_phase_id UUID;
  v_all_expired BOOLEAN;
  v_total_quests INT;
  v_expired_quests INT;
  v_submitted_quests INT;
  v_not_started_quests INT;
  v_next_phase INT;
  v_active_quest_id UUID;
  v_active_quest_index INT;
BEGIN
  -- Buscar fase atual do evento
  SELECT current_phase INTO v_current_phase
  FROM event_config
  LIMIT 1;

  IF v_current_phase IS NULL THEN
    RAISE NOTICE 'Nenhuma fase configurada no event_config';
    RETURN;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Verificando Fase %', v_current_phase;

  -- Buscar phase_id da fase atual
  SELECT id INTO v_phase_id
  FROM phases
  WHERE order_index = v_current_phase
  LIMIT 1;

  IF v_phase_id IS NULL THEN
    RAISE NOTICE '⚠️ Fase % não encontrada no banco', v_current_phase;
    RETURN;
  END IF;

  -- Contar total de quests da fase atual
  SELECT COUNT(*) INTO v_total_quests
  FROM quests
  WHERE phase_id = v_phase_id;

  IF v_total_quests = 0 THEN
    RAISE NOTICE '⚠️ Fase % não possui quests configuradas', v_current_phase;
    RETURN;
  END IF;

  RAISE NOTICE 'Total de quests na Fase %: %', v_current_phase, v_total_quests;

  -- ✅ MELHORIA 1: Fechar automaticamente quests expiradas
  RAISE NOTICE '🔄 Verificando quests expiradas para fechar...';

  UPDATE quests
  SET status = 'closed',
      updated_at = NOW()
  WHERE phase_id = v_phase_id
    AND status = 'active'
    AND started_at IS NOT NULL
    AND NOW() > (
      started_at +
      (planned_deadline_minutes * INTERVAL '1 minute') +
      (COALESCE(late_submission_window_minutes, 0) * INTERVAL '1 minute')
    );

  GET DIAGNOSTICS v_expired_quests = ROW_COUNT;

  IF v_expired_quests > 0 THEN
    RAISE NOTICE '✅ Fechadas % quest(s) expirada(s)', v_expired_quests;
  END IF;

  -- ✅ MELHORIA 2: Iniciar automaticamente a próxima quest quando há expirada
  IF v_expired_quests > 0 THEN
    RAISE NOTICE '▶️ Iniciando próxima quest automaticamente...';

    -- Encontrar a quest ativa (que foi antes expirada)
    SELECT id, order_index INTO v_active_quest_id, v_active_quest_index
    FROM quests
    WHERE phase_id = v_phase_id
      AND status = 'closed'
    ORDER BY order_index DESC
    LIMIT 1;

    -- Se encontrou uma quest fechada, iniciar a próxima
    IF v_active_quest_id IS NOT NULL THEN
      UPDATE quests
      SET status = 'active',
          started_at = NOW(),
          updated_at = NOW()
      WHERE id = (
        SELECT id FROM quests
        WHERE phase_id = v_phase_id
          AND order_index = v_active_quest_index + 1
          AND status = 'scheduled'
        LIMIT 1
      );

      GET DIAGNOSTICS v_expired_quests = ROW_COUNT;

      IF v_expired_quests > 0 THEN
        RAISE NOTICE '🎯 Quest % iniciada automaticamente', v_active_quest_index + 1;
      END IF;
    END IF;
  END IF;

  -- ========================================
  -- Recount after closing/opening quests
  -- ========================================

  -- Contar quests NÃO INICIADAS (started_at IS NULL)
  SELECT COUNT(*) INTO v_not_started_quests
  FROM quests
  WHERE phase_id = v_phase_id
    AND started_at IS NULL;

  RAISE NOTICE 'Quests não iniciadas: %', v_not_started_quests;

  -- ✅ VERIFICAÇÃO: Se há quests não iniciadas, NÃO avançar a fase
  IF v_not_started_quests > 0 THEN
    RAISE NOTICE '⏳ Fase % ainda tem % quest(s) não iniciada(s). Aguardando.',
                 v_current_phase, v_not_started_quests;
    RETURN;
  END IF;

  -- Contar quests totalmente expiradas/fechadas
  SELECT COUNT(*) INTO v_expired_quests
  FROM quests
  WHERE phase_id = v_phase_id
    AND status = 'closed';

  RAISE NOTICE 'Quests fechadas/expiradas: %/%', v_expired_quests, v_total_quests;

  -- Contar quests com submissões (considerar como "concluídas")
  SELECT COUNT(DISTINCT q.id) INTO v_submitted_quests
  FROM quests q
  WHERE q.phase_id = v_phase_id
    AND EXISTS (
      SELECT 1 FROM submissions s WHERE s.quest_id = q.id
    );

  RAISE NOTICE 'Quests com submissões: %', v_submitted_quests;

  -- ✅ LÓGICA: Só avançar a FASE se TODAS as quests foram processadas
  -- "Processadas" = fechadas OU submetidas
  v_all_expired := (v_expired_quests + v_submitted_quests) >= v_total_quests;

  RAISE NOTICE 'Soma (fechadas + submetidas): % >= % (total)',
               (v_expired_quests + v_submitted_quests), v_total_quests;

  IF v_all_expired THEN
    RAISE NOTICE '✅ Condição atendida: Fase % pode avançar', v_current_phase;

    -- Calcular próxima fase
    v_next_phase := v_current_phase + 1;

    -- Verificar se próxima fase existe
    IF EXISTS (SELECT 1 FROM phases WHERE order_index = v_next_phase) THEN
      RAISE NOTICE '➡️ Próxima fase (%) encontrada. Avançando...', v_next_phase;

      -- Avançar para próxima fase e setar timestamp de início
      EXECUTE format(
        'UPDATE event_config
         SET current_phase = $1,
             phase_%s_start_time = NOW(),
             updated_at = NOW()
         WHERE current_phase = $2',
        v_next_phase
      ) USING v_next_phase, v_current_phase;

      RAISE NOTICE '🎉 Fase % → Fase % (AVANÇADO COM SUCESSO)',
                   v_current_phase, v_next_phase;

      -- Iniciar primeira quest da próxima fase
      UPDATE quests
      SET started_at = NOW(),
          status = 'active',
          updated_at = NOW()
      WHERE id = (
        SELECT q.id
        FROM quests q
        JOIN phases p ON q.phase_id = p.id
        WHERE p.order_index = v_next_phase
          AND q.order_index = 1
        LIMIT 1
      );

      RAISE NOTICE '▶️ Quest 1 da Fase % iniciada automaticamente', v_next_phase;

    ELSE
      RAISE NOTICE '🏁 Fase % completa, mas não há próxima fase. Evento finalizado.', v_current_phase;
    END IF;
  ELSE
    RAISE NOTICE '⏳ Fase % ainda ativa. Processadas: %/% (fechadas: %, sub: %). Aguardando.',
                 v_current_phase,
                 (v_expired_quests + v_submitted_quests),
                 v_total_quests,
                 v_expired_quests,
                 v_submitted_quests;
  END IF;

  RAISE NOTICE '========================================';
END;
$$;

-- ==================================================
-- PASSO 3: Testar a função ANTES de usar
-- ==================================================
-- Execute manualmente para ver os logs:

-- SELECT auto_advance_phase();

-- Veja os logs no painel "Messages" do SQL Editor

-- ==================================================
-- PASSO 4: Ver estado atual após teste
-- ==================================================

-- Ver fase e quests:
SELECT
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.status,
  q.started_at,
  CASE
    WHEN q.started_at IS NULL THEN 'NÃO INICIADA'
    WHEN q.status = 'closed' THEN 'FECHADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN 'EXPIRADA'
    ELSE 'ATIVA'
  END as situacao
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = (SELECT current_phase FROM event_config LIMIT 1)
ORDER BY q.order_index;
