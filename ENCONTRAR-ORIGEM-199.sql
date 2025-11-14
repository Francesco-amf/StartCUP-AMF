-- ========================================
-- ENCONTRAR DE ONDE VEM O 199
-- ========================================

-- 1. ID de Áurea Forma + Submissões dela
SELECT
  'AUREA_ID' as tipo,
  id
FROM teams
WHERE name ILIKE '%aurea%';

-- 2. Submissões dela direto (sem LEFT JOIN)
SELECT
  'SUBMISSOES' as tipo,
  id,
  team_id,
  quest_id,
  status,
  final_points,
  is_late,
  late_penalty_applied
FROM submissions
WHERE team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%');

-- 3. Total de pontos dela
SELECT
  'TOTAL_PONTOS' as tipo,
  SUM(final_points) as total
FROM submissions
WHERE team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%')
AND status = 'evaluated';

-- 4. Ver TODAS as submissões de TODOS os times
SELECT
  t.name,
  COUNT(s.id) as submission_count,
  SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END) as total_points
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
GROUP BY t.id, t.name
ORDER BY total_points DESC;

-- 5. Verificar a view novamente
SELECT team_id, team_name, total_points
FROM live_ranking
WHERE team_name ILIKE '%aurea%';

-- 6. Debug: Como a view está calculando?
SELECT
  t.id,
  t.name,
  COUNT(DISTINCT s.id) as submission_count,
  SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END) as soma_points
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
WHERE t.name ILIKE '%aurea%'
GROUP BY t.id, t.name;
