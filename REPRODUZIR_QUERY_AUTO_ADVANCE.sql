-- 🔍 REPRODUZIR A QUERY QUE auto_advance_phase() USA PARA ATIVAR Quest X.1

-- Esta é a query EXATA que está na função (linhas 126-132)
-- Vamos ver qual quest ela retorna para a Fase 2

SELECT 
  q.id as "ID que a função pegou",
  q.order_index as "Quest #",
  q.name as "Nome",
  q.status as "Status Atual",
  q.started_at as "started_at",
  CASE 
    WHEN q.order_index = 1 THEN '✅ CORRETO - Pegou a Quest 2.1'
    ELSE '🚨 BUG! Pegou a quest errada!'
  END as "Análise"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
  AND q.order_index = 1
LIMIT 1;

-- ============================================================================
-- PROBLEMA SUSPEITO:
-- ============================================================================
-- A query acima está CORRETA (WHERE q.order_index = 1)
-- 
-- MAS se ela está correta, como a Quest 2.2 foi ativada?
-- 
-- Possibilidades:
-- 1. A função auto_advance_phase() foi modificada e a query mudou
-- 2. Houve múltiplas execuções e alguma falhou
-- 3. O código que você tem no Supabase é DIFERENTE do que vimos
-- 4. Você ativou Quest 2.2 manualmente sem perceber
-- 
-- Precisamos verificar o HISTÓRICO de quem ativou as quests
-- ============================================================================
