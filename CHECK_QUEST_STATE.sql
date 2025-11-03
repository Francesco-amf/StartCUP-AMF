-- ==========================================
-- CHECK: Current Quest State After Reset
-- ==========================================

-- QUERY 1: See ALL quests in Phase 1
SELECT
  q.id,
  q.name,
  q.status,
  q.started_at,
  q.order_index,
  p.name as phase,
  p.order_index as phase_order
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;

-- QUERY 2: See submissions for Team Alpha
SELECT
  s.id,
  s.quest_id,
  q.name as quest_name,
  s.status,
  s.submitted_at
FROM submissions s
JOIN quests q ON s.quest_id = q.id
WHERE s.team_id = (SELECT id FROM teams WHERE name = 'Equipe Alpha')
ORDER BY s.submitted_at DESC;

-- QUERY 3: See evaluations (status='evaluated')
SELECT
  s.quest_id,
  q.name as quest_name,
  s.status,
  COUNT(*) as count
FROM submissions s
JOIN quests q ON s.quest_id = q.id
WHERE s.team_id = (SELECT id FROM teams WHERE name = 'Equipe Alpha')
GROUP BY s.quest_id, q.name, s.status;

-- QUERY 4: Check event config
SELECT
  current_phase,
  event_started,
  event_ended
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
