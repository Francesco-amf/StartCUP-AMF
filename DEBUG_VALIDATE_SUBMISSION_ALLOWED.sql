-- ========================================
-- INVESTIGAR ERROS NA FUNÇÃO validate_submission_allowed
-- ========================================
-- Data: 2025-11-22
-- Objetivo: Testar a função RPC diretamente e ver logs de erro

-- ========================================
-- PASSO 1: Verificar se a função existe e sua definição
-- ========================================
SELECT 
  '=== INFORMAÇÕES DA FUNÇÃO validate_submission_allowed ===' as info;

SELECT 
  proname as nome_funcao,
  prosrc as codigo_fonte
FROM pg_proc
WHERE proname = 'validate_submission_allowed';

-- ========================================
-- PASSO 2: Testar a função com diferentes equipes
-- ========================================
SELECT 
  '=== TESTAR FUNÇÃO COM CADA EQUIPE ===' as info;

DO $$
DECLARE
  v_quest_id UUID;
  v_team RECORD;
  v_result RECORD;
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
  
  RAISE NOTICE '📋 Quest ativa: %', v_quest_id;
  RAISE NOTICE '';
  
  -- Testar para cada equipe
  FOR v_team IN SELECT id, name FROM teams ORDER BY name
  LOOP
    BEGIN
      -- Chamar a função
      SELECT * INTO v_result 
      FROM validate_submission_allowed(v_team.id, v_quest_id);
      
      RAISE NOTICE 'Equipe: %', v_team.name;
      RAISE NOTICE '  ├─ is_allowed: %', COALESCE(v_result.is_allowed::text, 'NULL');
      RAISE NOTICE '  ├─ reason: %', COALESCE(v_result.reason, 'NULL');
      RAISE NOTICE '  ├─ late_minutes: %', COALESCE(v_result.late_minutes_calculated::text, 'NULL');
      RAISE NOTICE '  ├─ penalty: %', COALESCE(v_result.penalty_calculated::text, 'NULL');
      RAISE NOTICE '  ├─ debug_now: %', COALESCE(v_result.debug_now::text, 'NULL');
      RAISE NOTICE '  ├─ debug_deadline: %', COALESCE(v_result.debug_deadline::text, 'NULL');
      RAISE NOTICE '  └─ debug_late_window_end: %', COALESCE(v_result.debug_late_window_end::text, 'NULL');
      RAISE NOTICE '';
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ ERRO na equipe %:', v_team.name;
      RAISE NOTICE '   SQLSTATE: %', SQLSTATE;
      RAISE NOTICE '   SQLERRM: %', SQLERRM;
      RAISE NOTICE '   DETAIL: %', COALESCE(PG_EXCEPTION_DETAIL, 'sem detalhes');
      RAISE NOTICE '   HINT: %', COALESCE(PG_EXCEPTION_HINT, 'sem dicas');
      RAISE NOTICE '';
    END;
  END LOOP;
END $$;

-- ========================================
-- PASSO 3: Verificar dados da quest ativa
-- ========================================
SELECT 
  '=== DADOS DA QUEST ATIVA ===' as info;

SELECT 
  id,
  name,
  status,
  started_at,
  ended_at,
  planned_deadline_minutes,
  late_submission_window_minutes,
  allow_late_submissions,
  -- Verificar se campos são NULL
  CASE WHEN started_at IS NULL THEN '❌ started_at é NULL' ELSE '✅ started_at OK' END as check_started_at,
  CASE WHEN planned_deadline_minutes IS NULL THEN '❌ planned_deadline_minutes é NULL' ELSE '✅ planned_deadline_minutes OK' END as check_planned,
  CASE WHEN late_submission_window_minutes IS NULL THEN '⚠️ late_window é NULL' ELSE '✅ late_window OK' END as check_late_window
FROM quests
WHERE status = 'active'
ORDER BY started_at DESC
LIMIT 1;

-- ========================================
-- PASSO 4: Verificar se calculate_late_penalty existe
-- ========================================
SELECT 
  '=== VERIFICAR FUNÇÃO calculate_late_penalty ===' as info;

SELECT 
  proname as nome_funcao,
  proargnames as parametros,
  prorettype::regtype as tipo_retorno
FROM pg_proc
WHERE proname = 'calculate_late_penalty';

-- ========================================
-- PASSO 5: Testar calculate_late_penalty diretamente
-- ========================================
SELECT 
  '=== TESTAR calculate_late_penalty ===' as info;

SELECT 
  'Atraso de 0 segundos' as teste,
  calculate_late_penalty(0) as penalidade
UNION ALL
SELECT 
  'Atraso de 60 segundos (1 min)' as teste,
  calculate_late_penalty(60) as penalidade
UNION ALL
SELECT 
  'Atraso de 300 segundos (5 min)' as teste,
  calculate_late_penalty(300) as penalidade
UNION ALL
SELECT 
  'Atraso de 600 segundos (10 min)' as teste,
  calculate_late_penalty(600) as penalidade
UNION ALL
SELECT 
  'Atraso de 900 segundos (15 min)' as teste,
  calculate_late_penalty(900) as penalidade
UNION ALL
SELECT 
  'Atraso de 1000 segundos (>15 min)' as teste,
  calculate_late_penalty(1000) as penalidade;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- Se a função retorna erro:
-- → Verificar se campos NULL estão causando divisão por zero
-- → Verificar se calculate_late_penalty existe e funciona
-- → Verificar se tipos de dados estão corretos (UUID, INTEGER, etc)
-- → Ver mensagens de erro específicas no EXCEPTION block
