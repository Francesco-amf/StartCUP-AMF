-- ========================================
-- CRIAR VIEW DE RANKING AO VIVO
-- ========================================
-- Esta view calcula o ranking das equipes em tempo real
-- baseado nas submissões avaliadas
-- ========================================

-- Remover a view antiga se existir
DROP VIEW IF EXISTS live_ranking CASCADE;

-- Criar a view nova (corrigida para deduzir penalidades sem duplicar pontos)
CREATE VIEW live_ranking AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.course,
  -- Soma segura dos pontos (apenas submissions avaliadas)
  COALESCE((
    SELECT SUM(s.final_points)
    FROM submissions s
    WHERE s.team_id = t.id AND s.status = 'evaluated'
  ), 0)
  -- Subtrai penalidades aplicadas à equipe
  - COALESCE((
    SELECT SUM(p.points_deduction)
    FROM penalties p
    WHERE p.team_id = t.id
  ), 0) AS total_points,
  -- Quantidade de quests concluídas (avaliadas)
  COALESCE((
    SELECT COUNT(DISTINCT s2.id)
    FROM submissions s2
    WHERE s2.team_id = t.id AND s2.status = 'evaluated'
  ), 0) AS quests_completed,
  0 AS power_ups_used -- Placeholder para futura lógica de power-ups
FROM teams t
-- Excluir usuários técnicos/cargos que não devem aparecer no ranking
WHERE t.email NOT IN ('admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com')
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
