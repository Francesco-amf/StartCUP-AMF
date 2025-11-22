-- ⚡ DIAGNÓSTICO: Por que Quest 2.1 foi pulada?

-- 1️⃣ VER TODAS AS QUESTS DA FASE 2
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.started_at IS NOT NULL as "Foi Iniciada?",
  q.started_at as "Iniciada Em",
  q.status as "Status",
  q.id as "Quest ID"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- 2️⃣ VER SE HÁ MÚLTIPLAS QUESTS COM order_index=1 NA FASE 2
SELECT 
  COUNT(*) as "Total Quest 2.1",
  STRING_AGG(q.id::text, ', ') as "IDs"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
  AND q.order_index = 1;

-- 3️⃣ VER SE HÁ MÚLTIPLAS QUESTS COM order_index=2 NA FASE 2
SELECT 
  COUNT(*) as "Total Quest 2.2",
  STRING_AGG(q.id::text, ', ') as "IDs"  
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
  AND q.order_index = 2;

-- 4️⃣ VERIFICAR AUTO_START_NEXT_QUEST
-- Executar manualmente para ver o que acontece:
SELECT auto_start_next_quest();
