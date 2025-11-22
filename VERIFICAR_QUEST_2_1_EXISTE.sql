-- 🔍 VERIFICAR SE A QUEST 2.1 TEM ALGUM PROBLEMA

-- 1️⃣ Ver se Quest 2.1 existe e está correta
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest #",
  q.id as "ID da Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "started_at",
  q.duration_minutes as "Duração",
  CASE 
    WHEN q.order_index = 1 THEN '🎯 Esta é a Quest X.1 que auto_advance_phase() deveria ativar'
    ELSE '❓ Não é a primeira'
  END as "Análise"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 AND q.order_index IN (1, 2)
ORDER BY q.order_index;



-- 2️⃣ Ver se tem múltiplas Quest 2.1 (bug de duplicação)
SELECT 
  COUNT(*) as "Quantas Quest 2.1 existem?",
  CASE 
    WHEN COUNT(*) > 1 THEN '🚨 DUPLICAÇÃO! Tem mais de uma Quest 2.1'
    WHEN COUNT(*) = 0 THEN '🚨 FALTA! Não existe Quest 2.1'
    ELSE '✅ OK - Apenas 1 Quest 2.1'
  END as "Diagnóstico"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 AND q.order_index = 1;



-- 3️⃣ Ver QUAL quest foi ativada quando a Fase 2 começou
-- (Procurar qual quest tem started_at mais próximo de quando BOSS 1.4 terminou)
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.started_at as "Quando Ativou",
  q.status as "Status",
  CASE 
    WHEN q.started_at IS NOT NULL AND p.order_index = 2 
    THEN 'Esta foi ativada na transição Fase 1→2'
    ELSE 'Outra'
  END as "Análise"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
  AND q.started_at IS NOT NULL
ORDER BY q.started_at ASC
LIMIT 5;


-- ============================================================================
-- TEORIA:
-- ============================================================================
-- auto_advance_phase() TEM CÓDIGO para ativar Quest X.1 (linhas 121-132)
-- MAS a Quest 2.2 foi ativada às 03:28:52, não a 2.1
--
-- Possibilidades:
-- 1. Quest 2.1 não existe no banco (foi deletada?)
-- 2. Tem múltiplas Quest 2.1 e o sistema pegou a errada
-- 3. O código foi modificado para ativar Quest X.2 em vez de X.1
-- 4. Houve erro na execução e depois alguém ativou 2.2 manualmente
-- ============================================================================
