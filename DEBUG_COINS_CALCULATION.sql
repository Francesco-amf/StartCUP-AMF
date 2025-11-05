-- ==========================================
-- 🔍 DEBUG: Investigação de AMF Coins
-- ==========================================
-- Problema: Equipe deveria ter 165 coins (200 - 5 - 10 - 20)
-- Mas está mostrando 565 coins
-- ==========================================

-- ==========================================
-- PASSO 1: Ver TODAS as transações da equipe
-- ==========================================
-- IMPORTANTE: Substitua 'SEU_TEAM_ID' pelo ID real da equipe

-- Ver submissions avaliadas
SELECT 
  'SUBMISSION' as tipo,
  s.id,
  q.name as quest_name,
  s.final_points as valor,
  s.created_at as data
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.team_id = 'SEU_TEAM_ID'
  AND s.status = 'evaluated'
ORDER BY s.created_at;

-- Ver penalidades
SELECT 
  'PENALIDADE' as tipo,
  p.id,
  p.penalty_type,
  -p.points_deduction as valor, -- Negativo
  p.created_at as data
FROM penalties p
WHERE p.team_id = 'SEU_TEAM_ID'
ORDER BY p.created_at;

-- Ver ajustes de coins (mentor, bônus, etc.)
SELECT 
  'AJUSTE' as tipo,
  ca.id,
  ca.reason,
  ca.amount as valor,
  ca.created_at as data,
  ca.reference_id
FROM coin_adjustments ca
WHERE ca.team_id = 'SEU_TEAM_ID'
ORDER BY ca.created_at;

-- ==========================================
-- PASSO 2: Cálculo Manual Total
-- ==========================================
WITH team_coins AS (
  SELECT 
    t.id,
    t.name,
    -- Submissions
    COALESCE(SUM(s.final_points), 0) as pontos_submissions,
    -- Penalidades
    COALESCE(SUM(p.points_deduction), 0) as pontos_penalidades,
    -- Ajustes (positivos e negativos)
    COALESCE(SUM(ca.amount), 0) as ajustes_coins,
    -- Total
    COALESCE(SUM(s.final_points), 0) 
      - COALESCE(SUM(p.points_deduction), 0) 
      + COALESCE(SUM(ca.amount), 0) as total_calculado
  FROM teams t
  LEFT JOIN submissions s ON t.id = s.team_id AND s.status = 'evaluated'
  LEFT JOIN penalties p ON t.id = p.team_id
  LEFT JOIN coin_adjustments ca ON t.id = ca.team_id
  WHERE t.id = 'SEU_TEAM_ID'
  GROUP BY t.id, t.name
)
SELECT 
  name as equipe,
  pontos_submissions as "Pontos de Submissions",
  pontos_penalidades as "Penalidades (será subtraído)",
  ajustes_coins as "Ajustes (positivos/negativos)",
  total_calculado as "TOTAL FINAL"
FROM team_coins;

-- ==========================================
-- PASSO 3: Comparar com live_ranking
-- ==========================================
SELECT 
  team_name,
  total_points as "Total no Ranking"
FROM live_ranking
WHERE team_id = 'SEU_TEAM_ID';

-- ==========================================
-- PASSO 4: Verificar duplicatas em coin_adjustments
-- ==========================================
-- Possível causa: mesma dedução inserida múltiplas vezes
SELECT 
  reason,
  amount,
  reference_id,
  created_at,
  COUNT(*) as quantidade
FROM coin_adjustments
WHERE team_id = 'SEU_TEAM_ID'
GROUP BY reason, amount, reference_id, created_at
HAVING COUNT(*) > 1
ORDER BY created_at;

-- ==========================================
-- PASSO 5: Verificar se há valores POSITIVOS em vez de NEGATIVOS
-- ==========================================
-- Chamadas de mentor DEVEM ser negativas!
SELECT 
  'ERRO: Valor positivo em mentor_request!' as problema,
  ca.id,
  ca.amount,
  ca.reason,
  ca.created_at
FROM coin_adjustments ca
WHERE ca.team_id = 'SEU_TEAM_ID'
  AND ca.reason = 'mentor_request'
  AND ca.amount > 0; -- Isso está ERRADO, deveria ser negativo

-- ==========================================
-- INSTRUÇÕES DE USO
-- ==========================================
-- 1. Identifique o team_id da equipe:
--    SELECT id, name FROM teams WHERE name LIKE '%nome%';
--
-- 2. Substitua 'SEU_TEAM_ID' em TODAS as queries acima
--
-- 3. Execute cada query separadamente no Supabase SQL Editor
--
-- 4. Analise os resultados:
--    - PASSO 1: Ver todas as transações individuais
--    - PASSO 2: Ver cálculo detalhado
--    - PASSO 3: Ver o que está no ranking
--    - PASSO 4: Verificar se há duplicatas
--    - PASSO 5: Verificar se há valores com sinal errado
-- ==========================================

-- ==========================================
-- POSSÍVEIS CAUSAS DO BUG
-- ==========================================
-- 
-- ❌ CAUSA 1: Valores positivos em vez de negativos
-- Sintoma: amount = 5 em vez de amount = -5
-- Solução: Corrigir a função request_mentor()
--
-- ❌ CAUSA 2: Duplicação de registros
-- Sintoma: Mesma dedução inserida 2x, 3x, etc.
-- Solução: Adicionar constraint UNIQUE ou verificar lógica
--
-- ❌ CAUSA 3: Submissões não avaliadas sendo contadas
-- Sintoma: final_points sendo somado mesmo com status='pending'
-- Solução: Verificar filtro s.status = 'evaluated'
--
-- ❌ CAUSA 4: JOIN duplicando linhas
-- Sintoma: LEFT JOIN multiplicando valores
-- Solução: Revisar GROUP BY na view
-- ==========================================
