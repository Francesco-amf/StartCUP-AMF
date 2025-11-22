-- 🔍 DIAGNÓSTICO: Por que 19 quests em vez de 15?
-- Execute cada bloco separadamente

-- 1️⃣ VER TODAS AS QUESTS (agrupadas por fase)
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.id as "ID"
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- 2️⃣ CONTAR QUESTS POR FASE
SELECT 
  p.order_index as "Fase",
  COUNT(q.id) as "Total de Quests",
  CASE 
    WHEN p.order_index = 1 THEN 'Deveria ter 4'
    WHEN p.order_index = 2 THEN 'Deveria ter 4'
    WHEN p.order_index = 3 THEN 'Deveria ter 4'
    WHEN p.order_index = 4 THEN 'Deveria ter 4'
    WHEN p.order_index = 5 THEN 'Deveria ter 3'
    ELSE 'Fase desconhecida'
  END as "Esperado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
GROUP BY p.order_index
ORDER BY p.order_index;

-- 3️⃣ VERIFICAR SE HÁ QUESTS DUPLICADAS
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  COUNT(*) as "Quantidade",
  CASE 
    WHEN COUNT(*) > 1 THEN '❌ DUPLICADA!'
    ELSE '✅ OK'
  END as "Status"
FROM quests q
JOIN phases p ON q.phase_id = p.id
GROUP BY p.order_index, q.order_index
HAVING COUNT(*) > 1
ORDER BY p.order_index, q.order_index;

-- 4️⃣ VER TODAS AS QUESTS COM DETALHES COMPLETOS
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest#",
  q.name as "Nome",
  q.deliverable_type as "Tipo",
  q.duration_minutes as "Duração",
  q.max_points as "Pontos",
  q.id as "Quest ID"
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;
