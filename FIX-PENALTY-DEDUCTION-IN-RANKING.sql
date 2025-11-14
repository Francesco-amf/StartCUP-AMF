-- ========================================
-- FIX: DEDUZIR PENALIDADES DO RANKING FINAL
-- ========================================
-- PROBLEMA: Submissões com atraso têm penalidade registrada
-- mas não estão sendo SUBTRAÍDAS do score final no ranking
--
-- CAUSA: A view live_ranking calcula total_points usando apenas
-- submissões (final_points) sem subtrair as penalidades
--
-- SOLUÇÃO: Atualizar a view para fazer:
-- total_points = SUM(final_points) - SUM(penalties.points_deduction)
-- ========================================

-- 1. Remover a view antiga
DROP VIEW IF EXISTS live_ranking CASCADE;

-- 2. Criar nova view que SUBRAI as penalidades
CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  -- ✅ FIX: Subtrair penalidades do score total
  COALESCE(SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN p.penalty_type = 'atraso' THEN p.points_deduction ELSE 0 END), 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN penalties p ON t.id = p.team_id
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

-- 3. Dar permissões à view
GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;

-- 4. Verificar resultado
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
ORDER BY total_points DESC
LIMIT 20;

-- 5. Verificar especificamente a equipe Áurea Forma
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
WHERE LOWER(team_name) LIKE '%aurea%'
   OR LOWER(team_name) LIKE '%forma%';

-- ========================================
-- VALIDAÇÃO
-- ========================================
-- Rodar este SELECT para verificar que penalidades estão sendo deduzidas:

SELECT
  t.name as team_name,
  s.final_points as submission_score,
  p.points_deduction as penalty_deducted,
  (s.final_points - COALESCE(p.points_deduction, 0)) as net_score,
  s.is_late,
  s.late_penalty_applied
FROM submissions s
JOIN teams t ON s.team_id = t.id
LEFT JOIN penalties p ON t.id = p.team_id AND p.penalty_type = 'atraso'
WHERE s.status = 'evaluated'
  AND s.is_late = TRUE
ORDER BY s.final_points DESC, p.points_deduction DESC;
