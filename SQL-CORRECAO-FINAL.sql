-- ========================================
-- CORREÇÃO FINAL: Penalidades SUBTRAINDO corretamente
-- ========================================
-- PROBLEMA: Score estava 189, deveria ser 179 (-10 penalidades)
-- Agora está 199 (+10) = PENALIDADES SENDO SOMADAS!
--
-- CAUSA: Query está ADICIONANDO penalidades em vez de SUBTRAIR
-- OU: Há problema no cálculo do final_points nas submissões
--
-- SOLUÇÃO: Verificar se final_points já inclui penalidade
-- Se SIM: Não precisa subtrair na view
-- Se NÃO: Subtrair corretamente
-- ========================================

-- PASSO 1: Verificar como final_points é calculado nas submissões
SELECT
  s.id,
  s.final_points,
  s.late_penalty_applied,
  q.name as quest_name
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
LIMIT 5;

-- Se final_points JÁ subtrai a penalidade automaticamente:
-- ENTÃO: Não faça nada na view, use final_points diretamente!

-- PASSO 2: Solução 1 - Se final_points já tem penalidade aplicada
DROP VIEW IF EXISTS live_ranking CASCADE;

CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  -- ✅ Se final_points JÁ inclui penalidade, apenas somar!
  COALESCE(SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END), 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;

-- Ver resultado
SELECT team_name, total_points, quests_completed
FROM live_ranking
ORDER BY total_points DESC
LIMIT 20;

-- DEBUG: Ver score da equipe específica
SELECT
  t.name as team_name,
  COUNT(s.id) as total_submissions,
  SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END) as total_points_calculated,
  (SELECT total_points FROM live_ranking WHERE team_id = t.id) as total_points_from_view
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
WHERE LOWER(t.name) LIKE '%aurea%' OR LOWER(t.name) LIKE '%forma%'
GROUP BY t.id, t.name;
