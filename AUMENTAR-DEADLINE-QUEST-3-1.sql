-- ==========================================
-- AUMENTAR DEADLINE: 2 minutos → 30 minutos
-- ==========================================

-- Encontrar e atualizar a quest
UPDATE quests
SET planned_deadline_minutes = 30
WHERE name ILIKE '%Montando o Exército%'
OR name ILIKE '%Quest 3.1%';

-- Verificar resultado
SELECT
  id,
  name,
  planned_deadline_minutes,
  (started_at + (planned_deadline_minutes || ' minutes')::INTERVAL) as new_deadline
FROM quests
WHERE name ILIKE '%Montando o Exército%'
OR name ILIKE '%Quest 3.1%';

-- Agora recalcular submissões dessa quest que são atrasadas
UPDATE submissions s
SET
  late_minutes = EXTRACT(EPOCH FROM (s.submitted_at - (
    SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
    FROM quests q WHERE q.id = s.quest_id
  )))::INTEGER / 60,
  late_penalty_applied = (
    SELECT calculate_late_penalty(
      EXTRACT(EPOCH FROM (s.submitted_at - (
        SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
        FROM quests q WHERE q.id = s.quest_id
      )))::INTEGER / 60
    )
  )
WHERE s.quest_id IN (
  SELECT id FROM quests WHERE name ILIKE '%Montando o Exército%' OR name ILIKE '%Quest 3.1%'
)
AND s.is_late = TRUE;

-- Verificar resultado
SELECT
  s.id,
  s.submitted_at,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  s.final_points,
  t.name as team_name
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE s.quest_id IN (
  SELECT id FROM quests WHERE name ILIKE '%Montando o Exército%' OR name ILIKE '%Quest 3.1%'
)
AND s.is_late = TRUE
ORDER BY s.submitted_at DESC
LIMIT 10;
