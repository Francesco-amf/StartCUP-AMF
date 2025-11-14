-- ========================================
-- DEBUG COMPLETO: Verificar cálculo de scores
-- ========================================

-- 1. Verificar quantas submissões a equipe tem
SELECT
  t.name as team_name,
  COUNT(s.id) as total_submissions,
  COUNT(CASE WHEN s.status = 'evaluated' THEN 1 END) as evaluated_submissions,
  SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END) as total_earned_points
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
WHERE LOWER(t.name) LIKE '%aurea%' OR LOWER(t.name) LIKE '%forma%'
GROUP BY t.id, t.name;

-- 2. Ver TODAS as submissões desta equipe (com detalhes)
SELECT
  t.name as team_name,
  q.name as quest_name,
  s.final_points,
  s.status,
  s.is_late,
  s.late_penalty_applied
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN quests q ON s.quest_id = q.id
WHERE LOWER(t.name) LIKE '%aurea%' OR LOWER(t.name) LIKE '%forma%'
ORDER BY s.created_at;

-- 3. Ver TODAS as penalidades desta equipe
SELECT
  t.name as team_name,
  p.id as penalty_id,
  p.penalty_type,
  p.points_deduction,
  p.created_at
FROM teams t
LEFT JOIN penalties p ON t.id = p.team_id
WHERE LOWER(t.name) LIKE '%aurea%' OR LOWER(t.name) LIKE '%forma%'
ORDER BY p.created_at;

-- 4. Cálculo MANUAL esperado
SELECT
  t.name as team_name,
  (SELECT SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END)
   FROM submissions s WHERE s.team_id = t.id) as earned_points,
  (SELECT COUNT(CASE WHEN s.status = 'evaluated' THEN 1 END)
   FROM submissions s WHERE s.team_id = t.id) as evaluated_count,
  (SELECT SUM(p.points_deduction)
   FROM penalties p WHERE p.team_id = t.id AND p.penalty_type = 'atraso') as penalties_atraso,
  ((SELECT SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END)
   FROM submissions s WHERE s.team_id = t.id) -
  COALESCE((SELECT SUM(p.points_deduction)
   FROM penalties p WHERE p.team_id = t.id AND p.penalty_type = 'atraso'), 0)) as should_be_final
FROM teams t
WHERE LOWER(t.name) LIKE '%aurea%' OR LOWER(t.name) LIKE '%forma%'
GROUP BY t.id, t.name;

-- 5. Ver o que a view atual está retornando
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
WHERE LOWER(team_name) LIKE '%aurea%' OR LOWER(team_name) LIKE '%forma%';
