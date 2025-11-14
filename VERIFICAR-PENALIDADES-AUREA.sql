-- ========================================
-- VERIFICAR PENALIDADES DA ÁUREA FORMA
-- ========================================

-- 1. Ver Áurea Forma ID
SELECT id, name FROM teams WHERE name ILIKE '%aurea%';

-- 2. Ver submissões dela
SELECT
  s.id,
  s.quest_id,
  s.final_points,
  s.status,
  s.submitted_at,
  q.name as quest_name
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%'
ORDER BY s.created_at;

-- 3. Ver penalidades dela (deve haver)
SELECT
  p.id,
  p.team_id,
  p.penalty_type,
  p.points_deduction,
  p.reason,
  p.created_at
FROM penalties p
LEFT JOIN teams t ON p.team_id = t.id
WHERE t.name ILIKE '%aurea%';

-- 4. Calcular manualmente
SELECT
  'Cálculo Manual' as tipo,
  (SELECT SUM(final_points) FROM submissions s
   LEFT JOIN teams t ON s.team_id = t.id
   WHERE t.name ILIKE '%aurea%' AND s.status = 'evaluated') as total_points_submissoes,
  (SELECT SUM(points_deduction) FROM penalties p
   LEFT JOIN teams t ON p.team_id = t.id
   WHERE t.name ILIKE '%aurea%') as total_penalidades,
  COALESCE(
    (SELECT SUM(final_points) FROM submissions s
     LEFT JOIN teams t ON s.team_id = t.id
     WHERE t.name ILIKE '%aurea%' AND s.status = 'evaluated'), 0
  ) - COALESCE(
    (SELECT SUM(points_deduction) FROM penalties p
     LEFT JOIN teams t ON p.team_id = t.id
     WHERE t.name ILIKE '%aurea%'), 0
  ) as score_final_correto;

-- 5. Ver na live_ranking
SELECT * FROM live_ranking WHERE team_name ILIKE '%aurea%';
