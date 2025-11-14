-- ========================================
-- VER O STATUS REAL DAS SUBMISSIONS
-- ========================================

-- 1. Ver TODOS os status de Áurea Forma
SELECT
  s.status,
  COUNT(*) as quantidade,
  SUM(s.final_points) as soma_final_points
FROM submissions s
WHERE s.team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%')
GROUP BY s.status;

-- 2. Ver CADA submission dela
SELECT
  s.id,
  s.status,
  s.final_points,
  s.is_late,
  s.late_penalty_applied,
  s.submitted_at
FROM submissions s
WHERE s.team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%')
ORDER BY s.submitted_at DESC;

-- 3. Ver todas as submissions no banco (todos os times)
SELECT
  status,
  COUNT(*) as quantidade
FROM submissions
GROUP BY status;

-- 4. Ver live_ranking para TODOS os times
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
ORDER BY total_points DESC;
