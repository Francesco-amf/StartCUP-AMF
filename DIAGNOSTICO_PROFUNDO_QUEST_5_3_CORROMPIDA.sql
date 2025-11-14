-- ============================================================================
-- DIAGNÓSTICO PROFUNDO: Por que EXATAMENTE Quest 5.3 falha no UPDATE?
-- ============================================================================

-- PASSO 1: Verificar se o ID existe no banco
SELECT 'PASSO 1: Verificar existência do ID' as "===";
SELECT
  COUNT(*) as total_encontrado
FROM quests
WHERE id = 'f8315362-888e-4187-9c6e-bf5ce152a79e';

-- PASSO 2: Ver TODOS os dados da Quest 5.3
SELECT 'PASSO 2: Todos os dados da Quest 5.3' as "===";
SELECT *
FROM quests
WHERE id = 'f8315362-888e-4187-9c6e-bf5ce152a79e';

-- PASSO 3: Verificar se há constraint que bloqueia UPDATE
SELECT 'PASSO 3: Constraints na tabela quests' as "===";
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'quests';

-- PASSO 4: Verificar triggers
SELECT 'PASSO 4: Triggers na tabela quests' as "===";
SELECT
  trigger_name,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'quests';

-- PASSO 5: Tentar UPDATE simples (sem started_at)
SELECT 'PASSO 5: Teste UPDATE - apenas status' as "===";
UPDATE quests
SET status = 'active'
WHERE id = 'f8315362-888e-4187-9c6e-bf5ce152a79e'
RETURNING id, name, status;

-- PASSO 6: Tentar UPDATE com started_at
SELECT 'PASSO 6: Teste UPDATE - com started_at' as "===";
UPDATE quests
SET status = 'active', started_at = '2025-11-11T16:09:03.282Z'::timestamp with time zone
WHERE id = 'f8315362-888e-4187-9c6e-bf5ce152a79e'
RETURNING id, name, status, started_at;

-- PASSO 7: Comparar com Quest 5.2 que funciona
SELECT 'PASSO 7: Comparar 5.2 (funciona) vs 5.3 (falha)' as "===";
SELECT
  q.id,
  q.order_index,
  q.name,
  q.status,
  CASE WHEN q.order_index = 2 THEN 'FUNCIONA' ELSE 'FALHA' END as resultado
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5 AND q.order_index IN (2, 3)
ORDER BY q.order_index;
