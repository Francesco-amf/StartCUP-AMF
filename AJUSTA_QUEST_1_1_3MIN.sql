-- ============================================================================
-- AJUSTA_QUEST_1_1_3MIN.sql
-- ============================================================================
-- Deixa Quest 1.1 com EXATAMENTE 3 minutos para terminar
-- ============================================================================

DO $$
DECLARE
  v_quest_1_1_id UUID;
BEGIN
  -- Buscar Quest 1.1
  SELECT q.id INTO v_quest_1_1_id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1 AND q.order_index = 1
  LIMIT 1;

  IF v_quest_1_1_id IS NULL THEN
    RAISE NOTICE '❌ Quest 1.1 não encontrada';
    RETURN;
  END IF;

  -- Calcular: Total = 45 min (30 prazo + 15 atraso)
  -- Para ter 1 min restante: started_at = NOW() - 44 min
  UPDATE quests
  SET started_at = NOW() - INTERVAL '44 minutes'
  WHERE id = v_quest_1_1_id;

  RAISE NOTICE '✅ Quest 1.1 ajustada!';
  RAISE NOTICE '   Faltam: ~1 minuto para terminar (perto do fim)';

END $$;

-- Verificação
SELECT 
  q.name,
  q.status,
  ROUND(EXTRACT(EPOCH FROM (
    q.started_at + INTERVAL '45 minutes' - NOW()
  )) / 60) as minutos_restantes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 1;
