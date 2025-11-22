-- ============================================================================
-- DIAGNOSTICO_ERRO_SUBMISSAO.sql
-- ============================================================================
-- Verificar problemas com submissão de Quest 1.1
-- ============================================================================

SELECT '=== 1. ESTADO DE SUBMISSÕES ATUAIS ===' as secao1;

SELECT 
  t.name as team,
  q.name as quest,
  s.id as submission_id,
  s.status,
  COUNT(*) as total_submissoes
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 1
GROUP BY t.id, t.name, q.id, q.name, s.id, s.status
ORDER BY t.name;

SELECT '' as espacador1;

SELECT '=== 2. VALIDAÇÃO SEQUENCIAL - CHECK_PREVIOUS_QUEST ===' as secao2;

SELECT 'Teste de validação sequencial para cada team:' as teste;

DO $$
DECLARE
  v_team_id UUID;
  v_quest_1_1_id UUID;
  v_can_submit BOOLEAN;
  v_reason TEXT;
  v_team_name TEXT;
BEGIN
  -- Buscar Quest 1.1
  SELECT id INTO v_quest_1_1_id
  FROM quests 
  WHERE order_index = 1;

  IF v_quest_1_1_id IS NULL THEN
    RAISE NOTICE '❌ Quest 1.1 não encontrada';
    RETURN;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Testando validação sequencial para Quest 1.1:';
  RAISE NOTICE '';

  -- Testar para cada team
  FOR v_team_id, v_team_name IN 
    SELECT id, name FROM teams ORDER BY name
  LOOP
    -- Chamar função de validação
    SELECT can_submit, reason 
    INTO v_can_submit, v_reason
    FROM check_previous_quest_submitted(v_team_id, v_quest_1_1_id);

    RAISE NOTICE 'Team: %', v_team_name;
    RAISE NOTICE '  Pode submeter?: %', v_can_submit;
    RAISE NOTICE '  Motivo: %', v_reason;
    RAISE NOTICE '';
  END LOOP;

END $$;

SELECT '' as espacador2;

SELECT '=== 3. VERIFICAR DUPLICAÇÕES ===' as secao3;

SELECT 'Procurar por múltiplas submissões da mesma team na mesma quest:' as check;

SELECT 
  t.name as team,
  q.name as quest,
  COUNT(*) as total_submissoes,
  CASE WHEN COUNT(*) > 1 THEN '⚠️ DUPLICADA!' ELSE '✅ OK' END as status
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
WHERE q.order_index = 1
GROUP BY t.id, t.name, q.id, q.name
HAVING COUNT(*) > 0
ORDER BY COUNT(*) DESC;

SELECT '' as espacador3;

SELECT '=== 4. VERIFICAR ESTADO DA QUEST 1.1 ===' as secao4;

SELECT 
  q.name,
  q.status,
  q.started_at,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  ROUND(EXTRACT(EPOCH FROM (
    q.started_at + 
    (q.planned_deadline_minutes * INTERVAL '1 minute') + 
    (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute') - 
    NOW()
  )) / 60) as minutos_restantes,
  CASE
    WHEN q.started_at IS NULL THEN '❌ NÃO INICIADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN '❌ EXPIRADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '⚠️ EM ATRASO'
    ELSE '✅ DENTRO DO PRAZO'
  END as situacao
FROM quests q
WHERE q.order_index = 1;

SELECT '' as espacador4;

SELECT '=== 5. VERIFICAR FUNÇÃO validate_submission_allowed ===' as secao5;

SELECT 'Esta função verifica se submissão é permitida:' as descricao;

DO $$
DECLARE
  v_team_id UUID;
  v_quest_1_1_id UUID;
  v_allowed BOOLEAN;
  v_reason TEXT;
BEGIN
  SELECT id INTO v_team_id FROM teams LIMIT 1;
  SELECT id INTO v_quest_1_1_id FROM quests WHERE order_index = 1 LIMIT 1;

  IF v_team_id IS NULL OR v_quest_1_1_id IS NULL THEN
    RAISE NOTICE '❌ Não foi possível encontrar team ou quest';
    RETURN;
  END IF;

  SELECT is_allowed, reason 
  INTO v_allowed, v_reason
  FROM validate_submission_allowed(v_team_id, v_quest_1_1_id);

  RAISE NOTICE '';
  RAISE NOTICE 'validate_submission_allowed() result:';
  RAISE NOTICE '  Permitida?: %', v_allowed;
  RAISE NOTICE '  Motivo: %', v_reason;

END $$;

SELECT '' as espacador5;

SELECT '=== 6. RESUMO DE POSSÍVEIS PROBLEMAS ===' as secao6;

SELECT '✅ Se tudo OK aqui, o problema é:' as verificacao;
SELECT '  1. Backend API - verificar logs em /api/submissions/create' as prob1;
SELECT '  2. Frontend - tentar em outra aba/navegador anônimo' as prob2;
SELECT '  3. Rate limiting - esperar alguns segundos antes de tentar novamente' as prob3;
SELECT '  4. Cache - fazer refresh da página (CTRL+F5)' as prob4;

SELECT '' as espacador6;

SELECT '❌ Se mostrar erro aqui:' as verificacao2;
SELECT '  1. Função sequencial bloqueando - precisa resolver' as erro1;
SELECT '  2. Submissão duplicada encontrada - precisa limpar' as erro2;
SELECT '  3. Quest expirada - tempo finalizou' as erro3;
