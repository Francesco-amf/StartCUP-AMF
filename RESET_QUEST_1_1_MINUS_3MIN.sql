-- ============================================================================
-- RESET_QUEST_1_1_MINUS_3MIN.sql
-- ============================================================================
-- Objetivo: Voltar situação para Quest 1.1 com 3 minutos para expirar
-- Simular comportamento correto após fix da lógica de avanço
-- ============================================================================

-- PASSO 1: Mostrar estado ATUAL
SELECT '=== ESTADO ANTES DO RESET ===' as passo_1;

SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.status,
  q.started_at,
  CASE 
    WHEN q.started_at IS NULL THEN '❌ Não iniciada'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN '⏸️ EXPIRADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '⚠️ ATRASADA'
    ELSE '✅ ATIVA'
  END as situacao,
  (SELECT COUNT(*) FROM submissions WHERE quest_id = q.id) as submissoes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;

SELECT '' as espacador1;

-- PASSO 2: Identificar Quest 1.1
SELECT 'Quest 1.1 identificada - iniciando reset...' as quest_1_1_info;

-- PASSO 3: Resetar Quest 1.1 para estar com 3 minutos para expirar
-- Quest 1.1 tem: 30 min prazo + 15 min atraso = 45 min total
-- Então: started_at = NOW() - 42 minutos (deixa 3 min para expirar)
DO $$
DECLARE
  v_quest_1_1_id UUID;
  v_new_started_at TIMESTAMP;
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

  -- Calcular started_at para deixar 3 minutos para expirar
  -- Total = 30 + 15 = 45 minutos
  -- Se NOW() = 45 minutos, então rest = 0
  -- Se NOW() = 42 minutos, então rest = 3
  -- Mas como faltam 17 min agora, preciso voltar 14 min para chegar a 3 min
  v_new_started_at := NOW() - INTERVAL '42 minutes';

  -- Atualizar Quest 1.1
  UPDATE quests
  SET started_at = v_new_started_at,
      status = 'active'
  WHERE id = v_quest_1_1_id;

  RAISE NOTICE '✅ Quest 1.1 resetada: started_at = NOW() - 42 minutos';
  RAISE NOTICE '   → Faltam 3 minutos para expirar (30 prazo regular + 15 atraso - 42 = 3)';
  RAISE NOTICE '   → Prazo regular expira em: 30 - 42 = -12 min (JÁ EXPIROU)';
  RAISE NOTICE '   → Prazo com atraso expira em: 45 - 42 = 3 minutos';

END $$;

SELECT '' as espacador2;

-- PASSO 4: Resetar quests posteriores que foram abertas indevidamente
-- Fechar Quest 1.2, 1.3, etc que foram abertas errado
DO $$
BEGIN
  -- Resetar status de quests que NÃO são 1.1
  UPDATE quests
  SET status = 'pending',
      started_at = NULL
  WHERE id IN (
    SELECT q.id
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = 1 AND q.order_index > 1
  );

  RAISE NOTICE '✅ Quests 1.2-1.4 resetadas para status="pending"';

END $$;

SELECT '' as espacador3;

-- PASSO 5: Listar submissões indevidas (que foram feitas quando quest avançou errado)
SELECT '=== SUBMISSÕES FEITAS DURANTE O PROBLEMA ===' as analise;

SELECT 
  s.id,
  s.team_id,
  s.quest_id,
  q.name,
  'ℹ️ Esta submissão pode ter sido feita em quest errada' as nota
FROM submissions s
JOIN quests q ON s.quest_id = q.id
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
  AND q.order_index > 1;

SELECT '' as espacador4;

-- PASSO 6: Mostrar estado DEPOIS do reset
SELECT '=== ESTADO DEPOIS DO RESET ===' as passo_6;

SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.status,
  q.started_at,
  CASE 
    WHEN q.started_at IS NULL THEN '❌ Não iniciada'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN '⏸️ EXPIRADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '⚠️ ATRASADA'
    ELSE '✅ ATIVA - 3 MINUTOS PARA EXPIRAR'
  END as situacao,
  (SELECT COUNT(*) FROM submissions WHERE quest_id = q.id) as submissoes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;

SELECT '' as espacador5;

-- PASSO 7: Verificar que auto_start vai funcionar corretamente
SELECT '=== VERIFICAÇÃO: LÓGICA CORRIGIDA ===' as verificacao;

DO $$
DECLARE
  v_current_quest_id UUID;
  v_current_quest_expired BOOLEAN;
  v_now_timestamp TIMESTAMP;
  v_started_at TIMESTAMP;
  v_deadline TIMESTAMP;
  v_late_end TIMESTAMP;
  v_minutes_remaining INTEGER;
BEGIN
  v_now_timestamp := NOW();
  
  -- Buscar Quest 1.1
  SELECT q.id, q.started_at INTO v_current_quest_id, v_started_at
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1 AND q.order_index = 1;

  -- Calcular prazos
  v_deadline := v_started_at + INTERVAL '30 minutes';
  v_late_end := v_started_at + INTERVAL '45 minutes';

  -- Verificar se expirou
  v_current_quest_expired := v_now_timestamp > v_late_end;

  -- Calcular minutos restantes
  v_minutes_remaining := EXTRACT(EPOCH FROM (v_late_end - v_now_timestamp)) / 60;

  RAISE NOTICE '📊 Estado da Quest 1.1:';
  RAISE NOTICE '   Iniciada em: %', v_started_at;
  RAISE NOTICE '   Prazo regular: %', v_deadline;
  RAISE NOTICE '   Prazo com atraso: %', v_late_end;
  RAISE NOTICE '   Expirou?: %', v_current_quest_expired;
  RAISE NOTICE '   Minutos restantes: %', ROUND(v_minutes_remaining);
  
  IF ROUND(v_minutes_remaining) = 3 THEN
    RAISE NOTICE '✅ CORRETO! Faltam 3 minutos para expirar';
  ELSE
    RAISE NOTICE '⚠️  Minutos: % (esperado: 3)', ROUND(v_minutes_remaining);
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🔍 NOVO COMPORTAMENTO (após FIX_ADVANCE_ONLY_TIME.sql):';
  RAISE NOTICE '   v_current_quest_finished := v_current_quest_expired;';
  RAISE NOTICE '   → Quest avança APENAS quando expirou (não por submissão)';
  RAISE NOTICE '   → Agora: v_current_quest_expired = FALSE (ainda há 3 min)';
  RAISE NOTICE '   → Resultado: Quest 1.1 permanece ativa ✅';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Quando 3 minutos passarem:';
  RAISE NOTICE '   → v_current_quest_expired = TRUE';
  RAISE NOTICE '   → auto_start_next_quest() ativará Quest 1.2 automaticamente';

END $$;

SELECT '' as espacador6;
SELECT '✅ RESET COMPLETO - Sistema pronto para teste' as conclusao;
