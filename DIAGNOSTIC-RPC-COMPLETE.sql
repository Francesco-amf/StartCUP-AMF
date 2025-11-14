-- ========================================
-- DIAGNÓSTICO COMPLETO: Penalidades Não Sendo Criadas
-- ========================================
-- OBJETIVO: Encontrar EXATAMENTE por que penalties não existem
-- ========================================

-- PASSO 1: Verificar quests da Áurea Forma
-- Mostrar toda a configuração de deadline
SELECT
  q.id,
  q.name,
  q.started_at,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  q.allow_late_submissions,
  q.status as quest_status,
  CASE
    WHEN q.started_at IS NULL THEN '❌ started_at é NULL!'
    ELSE q.started_at::TEXT
  END as quest_start_check,
  CASE
    WHEN q.planned_deadline_minutes = 0 THEN '⚠️  planned_deadline_minutes é 0!'
    ELSE q.planned_deadline_minutes::TEXT
  END as deadline_check
FROM quests q
WHERE id IN (
  SELECT DISTINCT s.quest_id
  FROM submissions s
  LEFT JOIN teams t ON s.team_id = t.id
  WHERE t.name ILIKE '%aurea%'
)
ORDER BY q.created_at DESC;

-- PASSO 2: Ver submissões atrasadas da Áurea Forma
-- Comparar submitted_at com o deadline calculado
SELECT
  s.id,
  s.quest_id,
  s.team_id,
  s.submitted_at,
  q.started_at,
  q.planned_deadline_minutes,
  s.is_late,
  s.late_penalty_applied,
  s.late_minutes,
  -- Calcular deadline
  (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL) as calculated_deadline,
  -- Ver se é maior que deadline
  CASE
    WHEN q.started_at IS NULL THEN 'Quest não iniciada'
    WHEN s.submitted_at > (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL) THEN
      'SIM - É atrasada!'
    ELSE 'Não - Dentro do prazo'
  END as is_actually_late,
  -- Minutos de atraso
  CASE
    WHEN q.started_at IS NULL THEN 0
    WHEN s.submitted_at > (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL) THEN
      EXTRACT(EPOCH FROM (s.submitted_at - (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL)))::INTEGER / 60
    ELSE 0
  END as actual_late_minutes
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%'
ORDER BY s.submitted_at DESC;

-- PASSO 3: CHAMAR O RPC DIRETAMENTE
-- Ver exatamente o que retorna para cada submissão
-- Pegamos a primeira submissão da Áurea Forma e testamos o RPC

WITH aurea_team AS (
  SELECT id FROM teams WHERE name ILIKE '%aurea%' LIMIT 1
),
first_submission AS (
  SELECT
    s.quest_id,
    s.team_id,
    s.submitted_at
  FROM submissions s
  WHERE s.team_id = (SELECT id FROM aurea_team)
    AND s.is_late = TRUE
  LIMIT 1
)
SELECT
  'RPC_TEST' as type,
  fs.team_id,
  fs.quest_id,
  fs.submitted_at,
  -- Chamando o RPC diretamente
  validate_submission_allowed(fs.team_id, fs.quest_id) as rpc_result
FROM first_submission fs;

-- PASSO 4: Decompor o resultado do RPC
-- Ver cada campo do resultado
WITH aurea_team AS (
  SELECT id FROM teams WHERE name ILIKE '%aurea%' LIMIT 1
),
first_submission AS (
  SELECT
    s.quest_id,
    s.team_id
  FROM submissions s
  WHERE s.team_id = (SELECT id FROM aurea_team)
    AND s.is_late = TRUE
  LIMIT 1
),
rpc_call AS (
  SELECT
    fs.team_id,
    fs.quest_id,
    (validate_submission_allowed(fs.team_id, fs.quest_id)).*
  FROM first_submission fs
)
SELECT
  team_id,
  quest_id,
  is_allowed,
  reason,
  late_minutes_calculated,
  penalty_calculated,
  debug_now,
  debug_deadline,
  debug_late_window_end,
  debug_v_minutes_late,
  debug_v_penalty
FROM rpc_call;

-- PASSO 5: Verificar se penalties table tem algum registro
SELECT
  COUNT(*) as total_penalties,
  COUNT(DISTINCT team_id) as teams_with_penalties,
  SUM(points_deduction) as total_deduction
FROM penalties
WHERE penalty_type = 'atraso';

-- PASSO 6: Penalidades específicas da Áurea Forma
SELECT
  p.id,
  p.team_id,
  p.penalty_type,
  p.points_deduction,
  p.reason,
  p.created_at
FROM penalties p
LEFT JOIN teams t ON p.team_id = t.id
WHERE t.name ILIKE '%aurea%'
  AND p.penalty_type = 'atraso'
ORDER BY p.created_at DESC;

-- PASSO 7: Ver live_ranking para Áurea Forma
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
WHERE team_name ILIKE '%aurea%';

-- PASSO 8: Resumo executivo
SELECT
  'RESUMO' as section,
  COUNT(DISTINCT s.id) as total_late_submissions,
  COUNT(DISTINCT p.id) as total_penalties_created,
  CASE
    WHEN COUNT(DISTINCT p.id) = 0 AND COUNT(DISTINCT s.id) > 0
      THEN '🔴 CRÍTICO: Penalties NÃO estão sendo criadas!'
    WHEN COUNT(DISTINCT p.id) = COUNT(DISTINCT s.id)
      THEN '✅ Penalties estão sendo criadas corretamente'
    ELSE '⚠️  Discrepância: nem todas as late submissions têm penalties'
  END as status
FROM submissions s
LEFT JOIN penalties p ON s.team_id = p.team_id
  AND p.penalty_type = 'atraso'
  AND s.is_late = TRUE;
