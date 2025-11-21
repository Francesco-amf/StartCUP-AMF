-- ============================================================================
-- CORREÇÃO FINAL: Sincronizar phase_1_start_time com Quest 1.1 started_at
-- ============================================================================

DO $$
DECLARE
  v_quest_start timestamp;
  v_phase1_before timestamp;
  v_phase1_after timestamp;
BEGIN
  -- Buscar started_at da Quest 1.1
  SELECT started_at INTO v_quest_start
  FROM quests
  WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
    AND order_index = 1
  LIMIT 1;
  
  -- Buscar valor atual de phase_1_start_time
  SELECT phase_1_start_time INTO v_phase1_before
  FROM event_config
  LIMIT 1;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'ANTES DA SINCRONIZAÇÃO:';
  RAISE NOTICE '  Quest 1.1 started_at:  %', v_quest_start;
  RAISE NOTICE '  phase_1_start_time:    %', v_phase1_before;
  RAISE NOTICE '  Diferença: % segundos', EXTRACT(EPOCH FROM (v_phase1_before - v_quest_start));
  RAISE NOTICE '==============================================';
  
  -- Atualizar phase_1_start_time para ser igual ao started_at da Quest 1.1
  UPDATE event_config
  SET phase_1_start_time = v_quest_start
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  -- Verificar após atualização
  SELECT phase_1_start_time INTO v_phase1_after
  FROM event_config
  LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE 'APÓS SINCRONIZAÇÃO:';
  RAISE NOTICE '  Quest 1.1 started_at:  %', v_quest_start;
  RAISE NOTICE '  phase_1_start_time:    %', v_phase1_after;
  
  IF v_phase1_after = v_quest_start THEN
    RAISE NOTICE '  ✅ VALORES SINCRONIZADOS PERFEITAMENTE!';
  ELSE
    RAISE NOTICE '  ⚠️  Ainda há diferença de % segundos', EXTRACT(EPOCH FROM (v_phase1_after - v_quest_start));
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA!';
  RAISE NOTICE '==============================================';
END $$;
