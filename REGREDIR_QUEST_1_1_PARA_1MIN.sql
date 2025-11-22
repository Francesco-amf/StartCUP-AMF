-- ============================================================================
-- REGREDIR_QUEST_1_1_PARA_1MIN.sql
-- ============================================================================
-- Regressar Quest 1.1 de 30 minutos para 1 minuto restante
-- ============================================================================

DO $$
DECLARE
  v_quest_1_1_id UUID;
  v_current_started_at TIMESTAMP;
  v_new_started_at TIMESTAMP;
BEGIN
  -- Buscar Quest 1.1
  SELECT q.id, q.started_at INTO v_quest_1_1_id, v_current_started_at
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1 AND q.order_index = 1
  LIMIT 1;

  IF v_quest_1_1_id IS NULL THEN
    RAISE NOTICE '❌ Quest 1.1 não encontrada';
    RETURN;
  END IF;

  RAISE NOTICE '📊 ANTES:';
  RAISE NOTICE '   started_at: %', v_current_started_at;
  RAISE NOTICE '   Minutos restantes: 30';

  -- Regressar 29 minutos para ir de 30 para 1 minuto
  -- De: started_at = NOW() - 15 min (que dá 30 min restantes)
  -- Para: started_at = NOW() - 44 min (que dá 1 min restante)
  v_new_started_at := v_current_started_at - INTERVAL '29 minutes';

  UPDATE quests
  SET started_at = v_new_started_at
  WHERE id = v_quest_1_1_id;

  RAISE NOTICE '';
  RAISE NOTICE '✅ DEPOIS:';
  RAISE NOTICE '   started_at: %', v_new_started_at;
  RAISE NOTICE '   Minutos restantes: ~1';

END $$;

-- Verificação
SELECT 
  '=== RESULTADO ===' as resultado,
  q.name,
  ROUND(EXTRACT(EPOCH FROM (
    q.started_at + INTERVAL '45 minutes' - NOW()
  )) / 60) as minutos_restantes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 1;
