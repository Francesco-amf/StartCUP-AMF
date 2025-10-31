-- ========================================
-- CRIAR VIEW DE RANKING AO VIVO
-- ========================================
-- Esta view calcula o ranking das equipes em tempo real
-- baseado nas submissões avaliadas
-- ========================================

-- Remover a view antiga se existir
DROP VIEW IF EXISTS live_ranking CASCADE;

-- Criar a view nova
CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  COALESCE(SUM(s.final_points), 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used  -- Placeholder para power-ups (implementar depois se necessário)
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

-- ========================================
-- VERIFICAR A VIEW
-- ========================================
SELECT * FROM live_ranking;

-- ========================================
-- PERMISSÕES (RLS não se aplica a views)
-- ========================================
-- Views herdam permissões das tabelas subjacentes
-- Como teams e submissions já têm RLS, a view também respeita

-- Para permitir acesso anônimo à view (para dashboard público):
GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;
