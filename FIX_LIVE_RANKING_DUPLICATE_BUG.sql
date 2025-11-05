-- ==========================================
-- 🐛 BUG IDENTIFICADO: LEFT JOIN duplicando valores
-- ==========================================
-- PROBLEMA: 
-- Quando uma equipe tem múltiplas submissions E múltiplos coin_adjustments,
-- o LEFT JOIN cria um produto cartesiano que MULTIPLICA os valores!
--
-- EXEMPLO:
-- - Equipe tem 2 submissions (100 + 100 = 200 coins)
-- - Equipe tem 3 ajustes (-5, -10, -20 = -35 coins)
-- 
-- LEFT JOIN cria 2 × 3 = 6 linhas!
-- SUM(s.final_points) = 100 + 100 + 100 + 100 + 100 + 100 = 600 (ERRADO!)
-- SUM(ca.amount) = -5 + -10 + -20 + -5 + -10 + -20 = -70 (ERRADO!)
-- Total = 600 - 70 = 530 (deveria ser 165!)
--
-- SOLUÇÃO: Usar subconsultas ou DISTINCT ON para evitar duplicação
-- ==========================================

-- ==========================================
-- NOVA VIEW CORRIGIDA: live_ranking
-- ==========================================
DROP VIEW IF EXISTS live_ranking CASCADE;

CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  
  -- Calcular cada soma separadamente para evitar produto cartesiano
  COALESCE(
    (SELECT SUM(s.final_points) 
     FROM submissions s 
     WHERE s.team_id = t.id AND s.status = 'evaluated'), 
    0
  ) 
  - COALESCE(
    (SELECT SUM(p.points_deduction) 
     FROM penalties p 
     WHERE p.team_id = t.id), 
    0
  ) 
  + COALESCE(
    (SELECT SUM(ca.amount) 
     FROM coin_adjustments ca 
     WHERE ca.team_id = t.id), 
    0
  ) as total_points,
  
  -- Contar quests completadas
  (SELECT COUNT(DISTINCT s.id) 
   FROM submissions s 
   WHERE s.team_id = t.id AND s.status = 'evaluated'
  ) as quests_completed,
  
  0 as power_ups_used
  
FROM teams t
WHERE t.email NOT IN ('admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com')
  AND t.course NOT IN ('Administration', 'Avaliação')
ORDER BY total_points DESC;

-- Permissões
GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;

-- ==========================================
-- VERIFICAÇÃO
-- ==========================================
-- Execute esta query para testar:
SELECT 
  team_name,
  total_points,
  quests_completed
FROM live_ranking
ORDER BY total_points DESC;

-- ==========================================
-- EXPLICAÇÃO TÉCNICA
-- ==========================================
-- 
-- ❌ PROBLEMA (versão antiga):
-- FROM teams t
-- LEFT JOIN submissions s ON t.id = s.team_id
-- LEFT JOIN coin_adjustments ca ON t.id = ca.team_id
-- GROUP BY t.id
--
-- Isso cria TODAS as combinações possíveis:
-- Team 1 → Submission 1 → Adjustment 1
-- Team 1 → Submission 1 → Adjustment 2
-- Team 1 → Submission 2 → Adjustment 1
-- Team 1 → Submission 2 → Adjustment 2
-- = 4 linhas em vez de 2!
--
-- ✅ SOLUÇÃO (versão nova):
-- SELECT SUM(...) FROM submissions WHERE team_id = t.id
-- SELECT SUM(...) FROM coin_adjustments WHERE team_id = t.id
--
-- Cada subconsulta é independente, sem produto cartesiano!
-- ==========================================
