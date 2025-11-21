-- ============================================================================
-- CORREÇÃO URGENTE: Timestamps de Fase com Timezone Errado
-- ============================================================================
-- PROBLEMA: phase_X_start_time e event_start_time estão 3h à frente (15:56 ao invés de 12:56)
-- CAUSA: Colunas são "timestamp without time zone" e interpretam valor como local
-- IMPACTO: Auto-advance de fase vai acontecer 3h mais tarde que deveria
-- SOLUÇÃO: Subtrair 3 horas dos valores existentes
-- ============================================================================

-- Backup dos valores atuais (para auditoria)
DO $$
DECLARE
  v_event_start timestamp;
  v_phase1_start timestamp;
BEGIN
  SELECT event_start_time, phase_1_start_time 
  INTO v_event_start, v_phase1_start
  FROM event_config 
  LIMIT 1;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'VALORES ANTES DA CORREÇÃO:';
  RAISE NOTICE '  event_start_time:    %', v_event_start;
  RAISE NOTICE '  phase_1_start_time:  %', v_phase1_start;
  RAISE NOTICE '==============================================';
END $$;

-- Corrigir event_start_time e phase_1_start_time (subtrair 3 horas)
UPDATE event_config
SET 
  event_start_time = event_start_time - INTERVAL '3 hours',
  phase_1_start_time = phase_1_start_time - INTERVAL '3 hours'
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND event_start_time IS NOT NULL;

-- Verificar valores após correção
DO $$
DECLARE
  v_event_start timestamp;
  v_phase1_start timestamp;
  v_quest_start timestamp;
BEGIN
  SELECT event_start_time, phase_1_start_time 
  INTO v_event_start, v_phase1_start
  FROM event_config 
  LIMIT 1;
  
  SELECT started_at
  INTO v_quest_start
  FROM quests
  WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
    AND order_index = 1
  LIMIT 1;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'VALORES APÓS CORREÇÃO:';
  RAISE NOTICE '  event_start_time:    %', v_event_start;
  RAISE NOTICE '  phase_1_start_time:  %', v_phase1_start;
  RAISE NOTICE '  Quest 1.1 started_at: %', v_quest_start;
  RAISE NOTICE '';
  RAISE NOTICE 'VERIFICAÇÃO:';
  
  IF v_phase1_start = v_quest_start THEN
    RAISE NOTICE '  ✅ phase_1_start_time e Quest 1.1 started_at estão IGUAIS (correto!)';
  ELSE
    RAISE NOTICE '  ⚠️  Diferença: % segundos', EXTRACT(EPOCH FROM (v_phase1_start - v_quest_start));
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '  1. Verificar que fase 1 agora termina às 15:26 BRT (não 18:26)';
  RAISE NOTICE '  2. Confirmar que auto-advance funciona no horário correto';
  RAISE NOTICE '  3. Monitorar logs do PhaseController';
  RAISE NOTICE '==============================================';
END $$;
