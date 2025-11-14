-- ========================================
-- ENCONTRAR EXATAMENTE O BUG
-- ========================================

-- 1. Todos os status de Áurea Forma
SELECT
  status,
  COUNT(*) as quantidade,
  SUM(final_points) as soma_pontos
FROM submissions
WHERE team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%')
GROUP BY status;

-- 2. Ver as submissões dela com TODOS os campos
SELECT
  id,
  team_id,
  quest_id,
  status,
  final_points,
  is_late,
  late_penalty_applied
FROM submissions
WHERE team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%');

-- 3. Verificar: a view está contando O QUÊ?
-- Simulando a view
SELECT
  t.id,
  t.name,
  COALESCE(SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END), 0) as total_evaluated,
  COALESCE(SUM(s.final_points), 0) as total_all,
  COUNT(DISTINCT s.id) as submission_count
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
WHERE t.name ILIKE '%aurea%'
GROUP BY t.id, t.name;

-- 4. Todos os times e seus totais (para comparar)
SELECT
  t.name,
  COUNT(s.id) as submission_count,
  COALESCE(SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END), 0) as total
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
GROUP BY t.id, t.name
ORDER BY total DESC
LIMIT 20;
