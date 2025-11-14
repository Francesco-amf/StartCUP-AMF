-- ========================================
-- FIX CORRIGIDO: DEDUZIR PENALIDADES CORRETAMENTE
-- ========================================
-- PROBLEMA: Query anterior fazia LEFT JOIN que criava Cartesian Product
-- Resultado: Penalidades eram multiplicadas (score aumentava em vez de diminuir!)
--
-- SOLUÇÃO: Usar subqueries para calcular penalidades SEPARADAMENTE
-- ========================================

-- 1. Remover a view com erro
DROP VIEW IF EXISTS live_ranking CASCADE;

-- 2. Criar nova view CORRIGIDA com cálculo separado de penalidades
CREATE VIEW live_ranking AS
WITH team_submissions AS (
  -- Calcular pontos por submissão avaliada
  SELECT
    s.team_id,
    SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END) as total_points
  FROM submissions s
  GROUP BY s.team_id
),
team_penalties AS (
  -- Calcular TOTAL de penalidades por equipe (SUM de TODOS os registros)
  SELECT
    p.team_id,
    SUM(p.points_deduction) as total_penalties
  FROM penalties p
  WHERE p.penalty_type = 'atraso'  -- Apenas penalidades de atraso
  GROUP BY p.team_id
)
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  -- ✅ CORRETO: Subtrair penalidades somadas corretamente
  COALESCE(ts.total_points, 0) - COALESCE(tp.total_penalties, 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN team_submissions ts ON t.id = ts.team_id
LEFT JOIN team_penalties tp ON t.id = tp.team_id
GROUP BY t.id, t.name, t.course, ts.total_points, tp.total_penalties
ORDER BY total_points DESC;

-- 3. Dar permissões
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

-- 5. Debug: Ver detalhes da equipe com problema
SELECT
  t.name as team_name,
  (SELECT SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END)
   FROM submissions s WHERE s.team_id = t.id) as earned_points,
  (SELECT SUM(p.points_deduction)
   FROM penalties p WHERE p.team_id = t.id AND p.penalty_type = 'atraso') as total_penalties,
  (SELECT SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END)
   FROM submissions s WHERE s.team_id = t.id) -
  COALESCE((SELECT SUM(p.points_deduction)
   FROM penalties p WHERE p.team_id = t.id AND p.penalty_type = 'atraso'), 0) as final_score
FROM teams t
WHERE LOWER(t.name) LIKE '%aurea%'
   OR LOWER(t.name) LIKE '%forma%';

-- 6. Verificar todas as penalidades de atraso
SELECT
  t.name as team_name,
  COUNT(p.id) as penalty_count,
  SUM(p.points_deduction) as total_deductions
FROM penalties p
JOIN teams t ON p.team_id = t.id
WHERE p.penalty_type = 'atraso'
GROUP BY p.team_id, t.name
ORDER BY total_deductions DESC;
