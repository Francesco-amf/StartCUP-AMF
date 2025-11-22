-- ============================================================================
-- DIAGNÓSTICO: Por que equipes em atraso estão com erro no upload
-- ============================================================================

-- PASSO 1: Verificar quest 1.1 e o status dela agora
\echo ''
\echo '=== VERIFICAR STATUS ATUAL DA QUEST 1.1 ==='
SELECT 
  q.id,
  q.name,
  q.order_index,
  q.status,
  q.started_at,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  NOW(),
  q.started_at + (q.planned_deadline_minutes || ' minutes')::interval as deadline_regular,
  q.started_at + (q.planned_deadline_minutes || ' minutes')::interval + (q.late_submission_window_minutes || ' minutes')::interval as deadline_com_atraso,
  CASE 
    WHEN NOW() <= (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '✅ NO PRAZO'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) AND NOW() <= (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) THEN '⚠️ EM ATRASO'
    ELSE '🚫 EXPIRADO'
  END as status_atual
FROM quests q
WHERE q.order_index = 1
LIMIT 1;

\echo ''
\echo '=== VERIFICAR SUBMISSÕES RECENTES (últimos 10 minutos) ==='
SELECT 
  s.id,
  t.name as team_name,
  q.name as quest_name,
  s.created_at,
  s.submitted_at,
  s.status,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  EXTRACT(EPOCH FROM (NOW() - s.created_at)) as segundos_atras
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
WHERE q.order_index = 1
  AND s.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY s.created_at DESC;

\echo ''
\echo '=== TESTAR validate_submission_allowed COM UMA EQUIPE EM ATRASO ==='

DO $$
DECLARE
  v_team_id UUID;
  v_quest_id UUID;
  v_result RECORD;
BEGIN
  -- Pegar primeira equipe e quest 1.1
  SELECT id INTO v_team_id FROM teams LIMIT 1;
  SELECT id INTO v_quest_id FROM quests WHERE order_index = 1 LIMIT 1;

  IF v_team_id IS NULL OR v_quest_id IS NULL THEN
    RAISE NOTICE '❌ Não foi possível encontrar team ou quest';
    RETURN;
  END IF;

  -- Chamar função
  SELECT * INTO v_result FROM validate_submission_allowed(v_team_id, v_quest_id);

  RAISE NOTICE '';
  RAISE NOTICE '🔍 Testando validate_submission_allowed:';
  RAISE NOTICE '   Team ID: %', v_team_id;
  RAISE NOTICE '   Quest ID: %', v_quest_id;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resultado:';
  RAISE NOTICE '   is_allowed: %', v_result.is_allowed;
  RAISE NOTICE '   reason: %', v_result.reason;
  RAISE NOTICE '   late_minutes_calculated: %', v_result.late_minutes_calculated;
  RAISE NOTICE '   penalty_calculated: %', v_result.penalty_calculated;
  RAISE NOTICE '';
  RAISE NOTICE '🐛 DEBUG:';
  RAISE NOTICE '   now: %', v_result.debug_now;
  RAISE NOTICE '   deadline: %', v_result.debug_deadline;
  RAISE NOTICE '   late_window_end: %', v_result.debug_late_window_end;
  RAISE NOTICE '   v_minutes_late: %', v_result.debug_v_minutes_late;
  RAISE NOTICE '   v_penalty: %', v_result.debug_v_penalty;

END $$;

\echo ''
\echo '=== VERIFICAR check_previous_quest_submitted ==='

DO $$
DECLARE
  v_team_id UUID;
  v_quest_id UUID;
  v_can_submit BOOLEAN;
  v_reason TEXT;
BEGIN
  SELECT id INTO v_team_id FROM teams LIMIT 1;
  SELECT id INTO v_quest_id FROM quests WHERE order_index = 1 LIMIT 1;

  SELECT can_submit, reason INTO v_can_submit, v_reason 
  FROM check_previous_quest_submitted(v_team_id, v_quest_id);

  RAISE NOTICE '';
  RAISE NOTICE '🔍 Testando check_previous_quest_submitted:';
  RAISE NOTICE '   can_submit: %', v_can_submit;
  RAISE NOTICE '   reason: %', v_reason;

END $$;

\echo ''
\echo '=== POSSÍVEIS PROBLEMAS E SOLUÇÕES ==='

SELECT '
✅ SE is_allowed = TRUE e can_submit = TRUE
   → Problema é no FRONTEND ou API route.ts
   → Verificar: console do browser (F12)
   
❌ SE is_allowed = FALSE
   → Quest status não é active/closed? ' as hint1;

SELECT '
❌ SE reason = "Prazo para submissão expirou completamente"
   → late_window_end expirou mesmo
   → Solução: Estender janela com ATUALIZAR quests
   
❌ SE reason = "Quest não está disponível para submissão"
   → Quest status é diferente de active ou closed
   → Solução: UPDATE quests SET status = "closed" WHERE id = ...
' as hint2;

SELECT '
❌ SE is_allowed = TRUE mas late_minutes_calculated = 0
   → Penalidade calculada errado
   → Verificar: NOW() vs deadline calculation
' as hint3;
