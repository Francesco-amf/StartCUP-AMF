-- ========================================
-- TESTE RPC: Por que penalidades não são criadas?
-- ========================================
-- OBJETIVO: Testar o RPC validate_submission_allowed() diretamente
-- para entender por que penalty_calculated está retornando 0
-- ========================================

-- PASSO 1: Ver as submissões atrasadas da Áurea Forma
SELECT
  s.id,
  s.quest_id,
  s.is_late,
  s.late_penalty_applied,
  s.final_points,
  q.name as quest_name,
  q.started_at,
  q.planned_deadline_minutes,
  s.created_at,
  CASE
    WHEN q.started_at IS NULL THEN 'NULO!'
    ELSE TO_CHAR(q.started_at, 'YYYY-MM-DD HH24:MI:SS')
  END as quest_start,
  CASE
    WHEN q.started_at IS NOT NULL THEN
      TO_CHAR(q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL, 'YYYY-MM-DD HH24:MI:SS')
    ELSE 'NULO!'
  END as quest_deadline
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%'
  AND s.is_late = TRUE
ORDER BY s.created_at DESC;

-- PASSO 2: Verificar a quest específica
SELECT
  id,
  name,
  started_at,
  planned_deadline_minutes,
  late_submission_window_minutes,
  TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI:SS') as start_formatted,
  CASE
    WHEN started_at IS NOT NULL THEN
      TO_CHAR(started_at + (planned_deadline_minutes || ' minutes')::INTERVAL, 'YYYY-MM-DD HH24:MI:SS')
    ELSE NULL
  END as deadline_formatted,
  created_at,
  CURRENT_TIMESTAMP as now
FROM quests
WHERE name ILIKE '%phase%' OR name ILIKE '%boss%'
ORDER BY created_at DESC
LIMIT 5;

-- PASSO 3: Testar a função RPC validate_submission_allowed()
-- Isso simula o que acontece quando o usuário tenta submeter atrasado

-- Primeiro, pegar IDs de uma submissão atrasada conhecida
WITH late_sub AS (
  SELECT
    s.id as submission_id,
    s.quest_id,
    s.team_id,
    s.created_at,
    q.started_at,
    q.planned_deadline_minutes,
    q.late_submission_window_minutes
  FROM submissions s
  LEFT JOIN quests q ON s.quest_id = q.id
  LEFT JOIN teams t ON s.team_id = t.id
  WHERE t.name ILIKE '%aurea%'
    AND s.is_late = TRUE
  LIMIT 1
)
SELECT
  submission_id,
  quest_id,
  team_id,
  'DADOS DA SUBMISSÃO' as check_type,
  created_at,
  started_at,
  planned_deadline_minutes,
  late_submission_window_minutes
FROM late_sub;

-- PASSO 4: Chamar o RPC para ver o que é retornado
-- Sintaxe: SELECT * FROM rpc_function(args)
-- O RPC retorna um ARRAY, precisamos fazer unnest ou acessar elementos

WITH latest_late_sub AS (
  SELECT
    s.quest_id,
    s.team_id
  FROM submissions s
  LEFT JOIN teams t ON s.team_id = t.id
  WHERE t.name ILIKE '%aurea%'
    AND s.is_late = TRUE
  ORDER BY s.created_at DESC
  LIMIT 1
)
SELECT
  'TESTE_RPC' as step,
  quest_id,
  team_id,
  'Chamando RPC...' as note
FROM latest_late_sub;

-- PASSO 5: Ver as penalidades que DEVERIAM ter sido criadas
SELECT
  'PENALIDADES_ESPERADAS' as check,
  COUNT(*) as total_penalties,
  SUM(points_deduction) as total_deduction
FROM penalties
WHERE team_id IN (
  SELECT id FROM teams WHERE name ILIKE '%aurea%'
)
AND penalty_type = 'atraso';

-- PASSO 6: Ver a trigger function
-- Esta query mostra a lógica do trigger
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_late_submission_fields_trigger'
  AND routine_schema = 'public';

-- PASSO 7: Verificar se há logs de erro ou comportamento
-- Ver todas as submissões da Áurea Forma
SELECT
  s.id,
  s.quest_id,
  s.is_late,
  s.late_penalty_applied,
  s.final_points,
  s.status,
  s.created_at,
  (SELECT COUNT(*) FROM penalties p WHERE p.team_id = s.team_id AND p.penalty_type = 'atraso') as penalties_count
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%'
ORDER BY s.created_at DESC;

-- PASSO 8: Resumo do problema
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM submissions WHERE is_late = TRUE) > 0
      AND (SELECT COUNT(*) FROM penalties WHERE penalty_type = 'atraso') = 0
    THEN '🔴 CRÍTICO: Submissions atrasadas existem mas penalidades não foram criadas!'
    WHEN (SELECT COUNT(*) FROM submissions WHERE is_late = TRUE) = 0
    THEN '⚠️  Não há submissions atrasadas para testar'
    ELSE '✅ Penalidades foram criadas'
  END as diagnosis;
