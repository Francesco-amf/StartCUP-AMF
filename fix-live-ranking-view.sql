-- ========================================
-- CORRIGIR VIEW DE RANKING AO VIVO
-- ========================================
-- Remover equipes fantasma (admin e avaliadores criados como test teams)
-- ========================================

DROP VIEW IF EXISTS live_ranking CASCADE;

CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  COALESCE(SUM(s.final_points), 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
WHERE t.email NOT IN ('admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com')
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

-- Verificar a view
SELECT * FROM live_ranking;

-- Permissões
GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;
