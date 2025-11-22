-- ============================================================================
-- AJUSTE_QUEST_1_1_PARA_3MIN.sql
-- ============================================================================
-- Calcular e ajustar Quest 1.1 para exatamente 3 minutos faltando
-- ============================================================================

DO $$
DECLARE
  v_quest_1_1_id UUID;
  v_current_started_at TIMESTAMP;
  v_current_remaining INTEGER;
  v_target_started_at TIMESTAMP;
  v_adjustment_minutes INTEGER;
BEGIN
  -- Buscar Quest 1.1 atual
  SELECT q.id, q.started_at INTO v_quest_1_1_id, v_current_started_at
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1 AND q.order_index = 1
  LIMIT 1;

  IF v_quest_1_1_id IS NULL THEN
    RAISE NOTICE '❌ Quest 1.1 não encontrada';
    RETURN;
  END IF;

  -- Calcular minutos restantes atualmente (Total = 45 min)
  v_current_remaining := EXTRACT(EPOCH FROM (
    v_current_started_at + INTERVAL '45 minutes' - NOW()
  )) / 60;

  RAISE NOTICE '📊 SITUAÇÃO ATUAL:';
  RAISE NOTICE '   Minutos restantes: %', ROUND(v_current_remaining);
  RAISE NOTICE '   Alvo: 3 minutos';
  RAISE NOTICE '   Diferença: % minutos a regressar', ROUND(v_current_remaining - 3);

  -- Calcular novo started_at para ter exatamente 3 minutos restantes
  -- started_at deve ser: NOW() - (45 - 3) = NOW() - 42 minutos
  v_target_started_at := NOW() - INTERVAL '42 minutes';
  v_adjustment_minutes := ROUND(v_current_remaining - 3);

  RAISE NOTICE '';
  RAISE NOTICE '✅ APLICANDO AJUSTE:';
  RAISE NOTICE '   Regressando: % minutos', v_adjustment_minutes;
  RAISE NOTICE '   Novo started_at: %', v_target_started_at;

  -- Aplicar ajuste
  UPDATE quests
  SET started_at = v_target_started_at
  WHERE id = v_quest_1_1_id;

  RAISE NOTICE '';
  RAISE NOTICE '✅ QUEST 1.1 AJUSTADA COM SUCESSO';

  -- Verificação pós-ajuste
  SELECT EXTRACT(EPOCH FROM (
    v_target_started_at + INTERVAL '45 minutes' - NOW()
  )) / 60 INTO v_current_remaining;

  RAISE NOTICE '   Minutos restantes agora: %', ROUND(v_current_remaining);

END $$;

-- Mostrar estado final
SELECT '=== ESTADO FINAL ===' as resultado;

SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.status,
  ROUND(EXTRACT(EPOCH FROM (
    q.started_at + INTERVAL '45 minutes' - NOW()
  )) / 60) as minutos_restantes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 1;
