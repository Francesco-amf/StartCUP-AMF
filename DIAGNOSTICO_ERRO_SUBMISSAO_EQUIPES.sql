-- ========================================
-- DIAGNÓSTICO: POR QUE ALGUMAS EQUIPES CONSEGUEM ENVIAR E OUTRAS NÃO?
-- ========================================
-- Data: 2025-11-22
-- Objetivo: Identificar diferenças entre equipes que conseguem vs não conseguem submeter

-- ========================================
-- PASSO 1: Identificar a quest ativa atual
-- ========================================
SELECT 
  '=== QUEST ATIVA ATUAL ===' as info,
  q.id,
  q.name,
  q.status,
  q.started_at,
  q.duration_minutes,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  p.order_index as fase,
  q.order_index as quest,
  -- Calcular deadlines
  q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL as deadline_regular,
  q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL + (q.late_submission_window_minutes || ' minutes')::INTERVAL as deadline_final,
  -- Tempo restante
  EXTRACT(EPOCH FROM (
    q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL + (q.late_submission_window_minutes || ' minutes')::INTERVAL - NOW()
  )) / 60 as minutos_restantes
FROM quests q
JOIN phases p ON p.id = q.phase_id
WHERE q.status = 'active'
ORDER BY q.started_at DESC
LIMIT 1;

-- ========================================
-- PASSO 2: Testar validação para TODAS as equipes
-- ========================================
SELECT 
  '=== VALIDAÇÃO POR EQUIPE ===' as info;

-- Buscar quest ativa
DO $$
DECLARE
  v_quest_id UUID;
  v_team RECORD;
  v_validation RECORD;
  v_sequential RECORD;
BEGIN
  -- Pegar quest ativa
  SELECT id INTO v_quest_id 
  FROM quests 
  WHERE status = 'active' 
  ORDER BY started_at DESC 
  LIMIT 1;
  
  IF v_quest_id IS NULL THEN
    RAISE NOTICE '❌ Nenhuma quest ativa encontrada';
    RETURN;
  END IF;
  
  RAISE NOTICE '📋 Testando validação para quest: %', v_quest_id;
  RAISE NOTICE '';
  
  -- Testar para cada equipe
  FOR v_team IN SELECT id, name FROM teams ORDER BY name
  LOOP
    -- Testar validate_submission_allowed
    BEGIN
      SELECT * INTO v_validation 
      FROM validate_submission_allowed(v_team.id, v_quest_id);
      
      -- Testar check_previous_quest_submitted
      SELECT * INTO v_sequential 
      FROM check_previous_quest_submitted(v_team.id, v_quest_id);
      
      RAISE NOTICE 'Equipe: %', v_team.name;
      RAISE NOTICE '  ├─ validate_submission_allowed:';
      RAISE NOTICE '  │  ├─ is_allowed: %', v_validation.is_allowed;
      RAISE NOTICE '  │  ├─ reason: %', v_validation.reason;
      RAISE NOTICE '  │  ├─ late_minutes: %', v_validation.late_minutes_calculated;
      RAISE NOTICE '  │  └─ penalty: %', v_validation.penalty_calculated;
      RAISE NOTICE '  └─ check_previous_quest_submitted:';
      RAISE NOTICE '     ├─ can_submit: %', v_sequential.can_submit;
      RAISE NOTICE '     └─ reason: %', v_sequential.reason;
      RAISE NOTICE '';
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Equipe: % - ERRO: %', v_team.name, SQLERRM;
      RAISE NOTICE '';
    END;
  END LOOP;
END $$;

-- ========================================
-- PASSO 3: Verificar submissões já realizadas
-- ========================================
SELECT 
  '=== SUBMISSÕES JÁ REALIZADAS (QUEST ATUAL) ===' as info;

WITH active_quest AS (
  SELECT id, name 
  FROM quests 
  WHERE status = 'active' 
  ORDER BY started_at DESC 
  LIMIT 1
)
SELECT 
  t.name as equipe,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ JÁ SUBMETEU'
    ELSE '❌ AINDA NÃO SUBMETEU'
  END as status_submissao,
  s.submitted_at as horario_submissao,
  s.late_minutes as minutos_atraso,
  s.late_penalty_applied as penalidade
FROM teams t
CROSS JOIN active_quest aq
LEFT JOIN submissions s ON s.team_id = t.id AND s.quest_id = aq.id
ORDER BY t.name;

-- ========================================
-- PASSO 4: Verificar quests anteriores não submetidas
-- ========================================
SELECT 
  '=== VERIFICAR QUESTS ANTERIORES NÃO SUBMETIDAS ===' as info;

WITH current_phase AS (
  SELECT current_phase FROM event_config LIMIT 1
),
active_quest AS (
  SELECT id, phase_id, order_index 
  FROM quests 
  WHERE status = 'active' 
  ORDER BY started_at DESC 
  LIMIT 1
),
previous_quests AS (
  SELECT q.id, q.name, q.order_index, p.order_index as phase_order
  FROM quests q
  JOIN phases p ON p.id = q.phase_id
  JOIN active_quest aq ON q.phase_id = aq.phase_id
  WHERE q.order_index < (SELECT order_index FROM active_quest)
)
SELECT 
  t.name as equipe,
  pq.name as quest_anterior,
  pq.phase_order || '.' || pq.order_index as quest_id,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ SUBMETIDA'
    ELSE '❌ NÃO SUBMETIDA (BLOQUEIA ATUAL)'
  END as status
FROM teams t
CROSS JOIN previous_quests pq
LEFT JOIN submissions s ON s.team_id = t.id AND s.quest_id = pq.id
WHERE s.id IS NULL -- Mostrar apenas não submetidas
ORDER BY t.name, pq.order_index;

-- ========================================
-- PASSO 5: Possíveis causas de erro
-- ========================================
SELECT 
  '=== POSSÍVEIS CAUSAS DO ERRO 500 ===' as diagnostico;

SELECT '1. Quest expirou (passou do deadline + late_window)' as causa_1;
SELECT '2. Quest anterior não foi submetida (validação sequencial)' as causa_2;
SELECT '3. Equipe já submeteu esta quest (duplicada)' as causa_3;
SELECT '4. Quest não está com status active/paused/closed' as causa_4;
SELECT '5. Tipo de arquivo inválido ou tamanho > 5MB' as causa_5;
SELECT '6. Função RPC validate_submission_allowed retornou erro' as causa_6;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- Se algumas equipes conseguem e outras não:
-- → Provavelmente é validação sequencial (quest anterior não submetida)
-- → Ou algumas equipes já submeteram esta quest
-- 
-- Se NENHUMA equipe consegue:
-- → Provavelmente quest expirou ou está com status errado
