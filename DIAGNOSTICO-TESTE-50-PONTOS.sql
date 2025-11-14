-- ==========================================
-- DIAGNÓSTICO: Por que 50 não virou 45
-- ==========================================

-- Encontrar a submissão avaliada com 50 pontos
SELECT
  s.id,
  s.submitted_at,
  s.is_late,
  s.late_penalty_applied,
  s.final_points,
  s.status,
  t.name as team_name,
  q.name as quest_name,
  -- Calcular o que deveria ser
  CASE
    WHEN s.late_penalty_applied > 0 THEN s.final_points - s.late_penalty_applied
    ELSE s.final_points
  END as what_it_should_be
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.status = 'evaluated'
AND s.final_points = 50
ORDER BY s.submitted_at DESC
LIMIT 5;

-- Se found, verificar os detalhes da quest
-- SELECT * FROM quests WHERE id = 'QUEST_ID_AQUI';
