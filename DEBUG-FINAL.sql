-- ========================================
-- DEBUG FINAL: Ver exatamente o que está acontecendo
-- ========================================

-- 1. Ver EXATAMENTE os dados brutos de Áurea Forma
SELECT
  s.id,
  s.team_id,
  s.status,
  s.final_points,
  s.is_late,
  s.late_penalty_applied,
  t.name as team_name
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%'
LIMIT 10;

-- 2. Ver a soma MANUAL
SELECT
  t.name,
  SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END) as soma_manual
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
WHERE t.name ILIKE '%aurea%'
GROUP BY t.id, t.name;

-- 3. Ver o que a view está retornando
SELECT *
FROM live_ranking
WHERE team_name ILIKE '%aurea%';

-- 4. Ver TODAS as submissões, não só Áurea
SELECT
  t.name,
  COUNT(s.id) as subs_total,
  SUM(CASE WHEN s.status = 'evaluated' THEN 1 ELSE 0 END) as subs_evaluated,
  SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END) as total_points
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
GROUP BY t.id, t.name
ORDER BY total_points DESC
LIMIT 20;
