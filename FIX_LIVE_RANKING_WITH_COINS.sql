-- ==========================================
-- FIX: Recriar live_ranking para incluir coin_adjustments
-- ==========================================
-- PROBLEMA: Total de AMF Coins não diminui quando equipe compra mentoria
-- CAUSA: View live_ranking não inclui coin_adjustments no cálculo
-- SOLUÇÃO: Recriar view com JOIN para coin_adjustments
-- ==========================================

-- Verificar dados ANTES da correção
SELECT 
  'ANTES DA CORREÇÃO - Equipe: ' || t.name as info,
  COALESCE(SUM(s.final_points), 0) as pontos_submissions,
  COALESCE(SUM(p.points_deduction), 0) as pontos_penalidades,
  COALESCE(SUM(ca.amount), 0) as ajustes_coins,
  COALESCE(SUM(s.final_points), 0) - COALESCE(SUM(p.points_deduction), 0) + COALESCE(SUM(ca.amount), 0) as total_correto
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id AND s.status = 'evaluated'
LEFT JOIN penalties p ON t.id = p.team_id
LEFT JOIN coin_adjustments ca ON t.id = ca.team_id
WHERE t.name = 'Código Sentencial (CS)' -- Substitua pelo nome da sua equipe
GROUP BY t.id, t.name;

-- Verificar o que está na view ATUAL
SELECT 
  'VIEW ATUAL - ' || team_name as info,
  total_points
FROM live_ranking
WHERE team_name = 'Código Sentencial (CS)'; -- Substitua pelo nome da sua equipe

-- Verificar todas as transações de coin_adjustments
SELECT 
  'Ajustes de Coins' as tipo,
  ca.created_at,
  ca.amount,
  ca.reason,
  ca.description
FROM coin_adjustments ca
JOIN teams t ON ca.team_id = t.id
WHERE t.name = 'Código Sentencial (CS)' -- Substitua pelo nome da sua equipe
ORDER BY ca.created_at DESC;

-- ==========================================
-- RECRIAR A VIEW
-- ==========================================

DROP VIEW IF EXISTS live_ranking CASCADE;

CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  COALESCE(SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END), 0) 
    - COALESCE(SUM(p.points_deduction), 0) 
    + COALESCE(SUM(ca.amount), 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN penalties p ON t.id = p.team_id
LEFT JOIN coin_adjustments ca ON t.id = ca.team_id
WHERE t.email NOT IN ('admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com')
  AND t.course NOT IN ('Administration', 'Avaliação')
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;

-- ==========================================
-- VERIFICAR DEPOIS DA CORREÇÃO
-- ==========================================

SELECT 
  'DEPOIS DA CORREÇÃO - ' || team_name as info,
  total_points as total_atualizado
FROM live_ranking
WHERE team_name = 'Código Sentencial (CS)'; -- Substitua pelo nome da sua equipe

-- Verificar TODAS as equipes
SELECT 
  team_name,
  total_points,
  quests_completed
FROM live_ranking
ORDER BY total_points DESC;
