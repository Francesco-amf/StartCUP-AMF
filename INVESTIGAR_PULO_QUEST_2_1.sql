-- 🔍 INVESTIGAR POR QUE A QUEST 2.1 FOI PULADA

-- 1️⃣ VER HISTÓRICO DE STATUS DA QUEST 2.1
SELECT 
  'Quest 2.1' as quest,
  q.status as "Status Atual",
  q.started_at as "Quando Iniciou",
  CASE 
    WHEN q.status = 'scheduled' THEN '📅 Nunca foi ativada automaticamente'
    WHEN q.status = 'active' AND q.started_at = '2025-11-22 03:36:15.104+00' THEN '👤 Ativada MANUALMENTE por você'
    WHEN q.status = 'completed' THEN '✅ Foi completada'
    WHEN q.status = 'skipped' THEN '⏭️ Foi PULADA!'
    ELSE '❓ Status estranho'
  END as "Análise"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 AND q.order_index = 1;

-- 2️⃣ VER QUAL QUEST VEM DEPOIS DO BOSS 1.4
SELECT 
  q.order_index as "Quest #",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "Quando Iniciou",
  CASE 
    WHEN q.order_index = 1 THEN '🎯 Esta devia ter ativado depois do BOSS 1.4'
    ELSE '❓ Esta não devia ativar agora'
  END as "Análise"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- 3️⃣ VER A LÓGICA DE auto_start_next_quest()
-- Procurar se tem alguma condição que pula quests
SELECT 
  proname as "Função",
  prosrc as "Código SQL"
FROM pg_proc
WHERE proname = 'auto_start_next_quest';

-- 4️⃣ VER SE HOUVE ALGUMA MODIFICAÇÃO MANUAL
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "started_at",
  CASE 
    WHEN q.started_at IS NOT NULL AND q.status = 'scheduled' THEN '🚨 INCONSISTÊNCIA!'
    WHEN q.started_at IS NULL AND q.status = 'active' THEN '🚨 ATIVADA SEM started_at!'
    WHEN q.started_at = '2025-11-22 03:28:52.327197+00' THEN '🤔 Quest 2.2 ativada automaticamente'
    WHEN q.started_at = '2025-11-22 03:36:15.104+00' THEN '👤 Quest 2.1 ativada MANUALMENTE'
    ELSE '✅ OK'
  END as "Análise"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- ============================================================================
-- HIPÓTESES:
-- ============================================================================
-- 1. A função auto_start_next_quest() pode ter lógica que:
--    - Pula quests com alguma condição especial
--    - Ativa a próxima quest baseado em algo além de order_index
--    - Tem bug que pula quest_order_index=1 da Fase 2
--
-- 2. Pode ter havido comando manual que ativou Quest 2.2 direto
--
-- 3. A Quest 2.1 pode ter sido marcada como 'completed' ou 'skipped' antes
--
-- 4. Pode ter bug no cálculo de "próxima quest"
-- ============================================================================
