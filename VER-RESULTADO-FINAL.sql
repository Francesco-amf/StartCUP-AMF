-- ========================================
-- VER O RESULTADO FINAL COMPLETO
-- ========================================

-- 1. Submissões de Áurea Forma AGORA
SELECT
  'SUBMISSOES_AUREA' as check_type,
  s.id,
  s.final_points,
  s.is_late,
  s.late_penalty_applied
FROM submissions s
WHERE s.team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%');

-- 2. Soma manual dos final_points
SELECT
  'SOMA_MANUAL' as check_type,
  SUM(final_points) as total_points
FROM submissions
WHERE team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%')
AND status = 'evaluated';

-- 3. Todos os times no live_ranking
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
ORDER BY total_points DESC
LIMIT 20;

-- 4. Áurea Forma no live_ranking
SELECT
  'AUREA_RANKING' as check_type,
  team_name,
  total_points
FROM live_ranking
WHERE team_name ILIKE '%aurea%';

-- 5. Verificar se o UPDATE funcionou
SELECT
  'VERIFY_UPDATE' as check_type,
  COUNT(*) as submissions_with_is_late_true,
  COUNT(CASE WHEN late_penalty_applied > 0 THEN 1 END) as submissions_with_penalty,
  SUM(late_penalty_applied) as total_penalty
FROM submissions
WHERE team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%');
