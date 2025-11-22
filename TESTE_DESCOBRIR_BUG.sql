-- 🔍 TESTE PARA DESCOBRIR O BUG

-- 1️⃣ Ver se há duplicação de order_index entre fases
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.id as "ID",
  q.name as "Nome",
  q.phase_id as "phase_id",
  CASE 
    WHEN q.order_index = 1 THEN '🎯 Esta é Quest X.1'
    WHEN q.order_index = 2 THEN '🎯 Esta é Quest X.2'
    ELSE 'Outra'
  END as "Tipo"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index IN (1, 2, 3)
ORDER BY q.order_index, p.order_index;

-- 2️⃣ REPRODUZIR EXATAMENTE a query bugada de auto_advance_phase
-- Ver qual quest ela retorna para Fase 2
SELECT 
  q.id as "ID que seria ativado",
  q.order_index as "Quest #",
  q.name as "Nome",
  p.order_index as "Fase",
  CASE 
    WHEN q.order_index = 1 AND p.order_index = 2 THEN '✅ CORRETO - Quest 2.1'
    ELSE '🚨 ERRADO! Bug confirmado'
  END as "Resultado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
  AND q.order_index = 1
LIMIT 1;

-- 3️⃣ Ver todas as quests da Fase 2 ordenadas por ID
-- (LIMIT 1 sem ORDER BY pega a primeira por ID físico)
SELECT 
  q.id as "ID",
  q.order_index as "Quest #",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "started_at",
  CASE 
    WHEN q.order_index = 1 THEN '🎯 Esta DEVERIA ser a primeira'
    ELSE 'Outra'
  END as "Ordem"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.id;  -- Ordem física no banco (UUID)

-- 4️⃣ Ver se phase_id está correto
SELECT 
  'Fase 2' as "Fase",
  id as "phase_id esperado",
  order_index as "order_index",
  name as "Nome"
FROM phases
WHERE order_index = 2;

-- ============================================================================
-- ANÁLISE:
-- ============================================================================
-- Se o resultado do bloco 3 mostrar Quest 2.2 ANTES da Quest 2.1 por ordem de ID,
-- então o bug está confirmado:
--
-- A query usa LIMIT 1 SEM ORDER BY q.order_index
-- PostgreSQL retorna por ordem física (UUID)
-- Se UUID da Quest 2.2 for menor que UUID da Quest 2.1, pega a 2.2 primeiro!
-- ============================================================================
