-- ========================================
-- CORRIGIR LIVE_RANKING VIEW
-- ========================================
-- A view anterior não estava deduzindo penalidades
-- Esta nova versão calcula corretamente
-- ========================================

DROP VIEW IF EXISTS live_ranking CASCADE;

CREATE VIEW live_ranking AS
WITH team_submissions AS (
  -- Calcular total de pontos das submissões avaliadas
  SELECT
    team_id,
    SUM(CASE WHEN status = 'evaluated' THEN final_points ELSE 0 END) as total_submission_points
  FROM submissions
  GROUP BY team_id
),
team_penalties AS (
  -- Calcular total de penalidades
  SELECT
    team_id,
    SUM(points_deduction) as total_penalties
  FROM penalties
  WHERE penalty_type = 'atraso'
  GROUP BY team_id
)
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  -- Calcular: submissões - penalidades
  COALESCE(ts.total_submission_points, 0) - COALESCE(tp.total_penalties, 0) as total_points,
  (SELECT COUNT(DISTINCT s.id)
   FROM submissions s
   WHERE s.team_id = t.id AND s.status = 'evaluated') as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN team_submissions ts ON t.id = ts.team_id
LEFT JOIN team_penalties tp ON t.id = tp.team_id
ORDER BY total_points DESC;

-- Dar permissões
GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;

-- Verificar resultado
SELECT 'View recriada com sucesso!' as status;

-- Ver Áurea Forma
SELECT team_name, total_points, quests_completed
FROM live_ranking
WHERE team_name ILIKE '%aurea%';
