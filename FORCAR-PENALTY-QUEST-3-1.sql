-- ==========================================
-- FORÇAR: Quest 3.1 com -5 penalty
-- ==========================================

-- A submissão foi atrasada (sim), mas o deadline era tão curto
-- que arredondou para 0 minutos
-- Solução: forçar -5 de penalty mesmo assim

UPDATE submissions s
SET
  late_penalty_applied = 5,
  final_points = final_points - 5  -- 50 → 45
WHERE s.quest_id IN (
  SELECT id FROM quests WHERE name ILIKE '%Montando o Exército%' OR name ILIKE '%Quest 3.1%'
)
AND s.is_late = TRUE
AND s.late_penalty_applied = 0
AND s.status = 'evaluated'
AND s.final_points = 50;

-- Verificar
SELECT
  s.id,
  s.is_late,
  s.late_penalty_applied,
  s.final_points,
  s.status,
  t.name as team_name
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE s.quest_id IN (
  SELECT id FROM quests WHERE name ILIKE '%Montando o Exército%' OR name ILIKE '%Quest 3.1%'
)
AND s.is_late = TRUE
ORDER BY s.submitted_at DESC;

-- Verificar live_ranking
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
WHERE team_name ILIKE '%aurea%';
