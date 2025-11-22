-- Verificar estado REAL da equipe Mistos - Qual quest deveria aparecer?

SELECT 
  '🔍 DEBUG: Estado da equipe Mistos' as debug,
  t.name as team_name,
  t.id as team_id
FROM teams t
WHERE t.name = 'Mistos'
LIMIT 1;

-- Ver configuração do evento
SELECT 
  '🔍 DEBUG: Configuração do evento' as debug,
  current_phase,
  event_started,
  event_ended
FROM event_config
LIMIT 1;

-- Ver TODAS as quests da equipe Mistos (com todos os detalhes)
SELECT 
  '🔍 DEBUG: Todas as quests de Mistos' as debug,
  q.id,
  q.name,
  p.name as phase_name,
  p.order_index as phase_order,
  q.order_index as quest_order,
  q.started_at,
  q.completed_at,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  CASE 
    WHEN q.started_at IS NULL THEN '❌ Não iniciada'
    WHEN q.completed_at IS NOT NULL THEN '✅ Completa'
    ELSE '⏳ Em andamento'
  END as status
FROM quests q
JOIN phases p ON q.phase_id = p.id
JOIN teams t ON q.team_id = t.id
WHERE t.name = 'Mistos'
ORDER BY p.order_index, q.order_index;

-- Ver quais quests têm submissions
SELECT 
  '🔍 DEBUG: Submissões de Mistos' as debug,
  q.name as quest_name,
  COUNT(s.id) as num_submissions,
  MAX(s.submitted_at) as ultima_submissao
FROM quests q
LEFT JOIN submissions s ON q.id = s.quest_id
JOIN teams t ON q.team_id = t.id
WHERE t.name = 'Mistos'
GROUP BY q.name
ORDER BY q.order_index;

-- A QUEST ATUAL CALCULADA (mesmo algoritmo do dashboard)
WITH current_phase_info AS (
  SELECT current_phase FROM event_config LIMIT 1
),
mistos_team AS (
  SELECT id FROM teams WHERE name = 'Mistos' LIMIT 1
),
quests_in_phase AS (
  SELECT 
    q.id,
    q.name,
    q.order_index,
    q.started_at,
    q.completed_at,
    q.planned_deadline_minutes,
    q.late_submission_window_minutes
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  CROSS JOIN current_phase_info
  WHERE q.team_id = (SELECT id FROM mistos_team)
    AND p.order_index = (SELECT current_phase FROM current_phase_info)
  ORDER BY q.order_index
),
submitted_quests AS (
  SELECT DISTINCT quest_id FROM submissions
  WHERE team_id = (SELECT id FROM mistos_team)
)
SELECT 
  '🔍 DEBUG: Quest ATUAL calculada' as debug,
  q.name,
  q.order_index,
  q.started_at,
  CASE 
    WHEN q.id IN (SELECT quest_id FROM submitted_quests) THEN '✅ SUBMETIDA'
    ELSE '⏳ A SUBMETER'
  END as submission_status,
  CASE 
    WHEN q.started_at IS NULL THEN '❌ NÃO INICIADA'
    WHEN q.started_at IS NOT NULL THEN '✅ INICIADA em ' || q.started_at
  END as start_status
FROM quests_in_phase q
ORDER BY q.order_index
LIMIT 1;
