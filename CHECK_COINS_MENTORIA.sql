-- ==========================================
-- 🪙 DIAGNÓSTICO: AMF Coins após Mentoria
-- ==========================================
-- Problema relatado:
-- 1. Total de coins não diminuiu após comprar mentoria (5 coins)
-- 2. Histórico mostra -5 mas não mostra ganhos anteriores
-- ==========================================

-- 1. Ver estado atual da live_ranking
SELECT 
  team_name,
  total_points,
  quests_completed
FROM live_ranking
ORDER BY team_name;

-- 2. Ver todas as submissions avaliadas (ganhos)
SELECT 
  t.name as team_name,
  s.id as submission_id,
  q.name as quest_name,
  s.final_points,
  s.status,
  s.created_at
FROM submissions s
JOIN teams t ON s.team_id = t.id
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.status = 'evaluated'
ORDER BY t.name, s.created_at DESC;

-- 3. Ver todos os ajustes de coins (coin_adjustments)
SELECT 
  t.name as team_name,
  ca.amount,
  ca.reason,
  ca.created_at,
  ca.reference_id
FROM coin_adjustments ca
JOIN teams t ON ca.team_id = t.id
ORDER BY t.name, ca.created_at DESC;

-- 4. Ver todas as solicitações de mentoria
SELECT 
  t.name as team_name,
  e.name as mentor_name,
  mr.phase,
  mr.amf_coins_cost,
  mr.request_number,
  mr.status,
  mr.created_at
FROM mentor_requests mr
JOIN teams t ON mr.team_id = t.id
JOIN evaluators e ON mr.mentor_id = e.id
ORDER BY mr.created_at DESC;

-- 5. Cálculo manual do total para uma equipe específica
-- (substitua 'NOME_DA_EQUIPE' pelo nome real)
SELECT 
  'Submissions' as origem,
  COALESCE(SUM(s.final_points), 0) as total
FROM submissions s
JOIN teams t ON s.team_id = t.id
WHERE t.name = 'NOME_DA_EQUIPE' -- ⚠️ SUBSTITUIR AQUI
  AND s.status = 'evaluated'

UNION ALL

SELECT 
  'Penalidades' as origem,
  -COALESCE(SUM(p.points_deduction), 0) as total
FROM penalties p
JOIN teams t ON p.team_id = t.id
WHERE t.name = 'NOME_DA_EQUIPE' -- ⚠️ SUBSTITUIR AQUI

UNION ALL

SELECT 
  'Ajustes (coin_adjustments)' as origem,
  COALESCE(SUM(ca.amount), 0) as total
FROM coin_adjustments ca
JOIN teams t ON ca.team_id = t.id
WHERE t.name = 'NOME_DA_EQUIPE'; -- ⚠️ SUBSTITUIR AQUI

-- 6. Ver todas as penalidades
SELECT 
  t.name as team_name,
  p.penalty_type,
  p.points_deduction,
  p.reason,
  p.created_at
FROM penalties p
JOIN teams t ON p.team_id = t.id
ORDER BY t.name, p.created_at DESC;

-- ==========================================
-- 📝 NOTAS:
-- ==========================================
-- 
-- O total_points na live_ranking é calculado por:
-- total_points = SUM(submissions.final_points) 
--              - SUM(penalties.points_deduction)
--              + SUM(coin_adjustments.amount)
-- 
-- Se a mentoria custou 5 coins, deveria ter:
-- 1. Um registro em mentor_requests com amf_coins_cost = 5
-- 2. Um registro em coin_adjustments com amount = -5
-- 
-- Se o histórico não mostra ganhos anteriores:
-- - Verificar se existem submissions com status='evaluated'
-- - Verificar se AMFCoinsHistory está buscando submissions corretamente
-- 
-- ==========================================
