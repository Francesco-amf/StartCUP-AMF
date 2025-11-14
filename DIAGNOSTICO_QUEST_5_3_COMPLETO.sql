-- ============================================================================
-- DIAGNÓSTICO COMPLETO - Executar TUDO de uma vez
-- ============================================================================
-- Copie e cole tudo isso no Supabase SQL Editor
-- Cada bloco é independente e mostrará seu resultado
-- ============================================================================

-- PASSO 1: Quests atuais da Fase 5
-- Resultado esperado: 3 quests (5.1, 5.2, 5.3)
SELECT 'PASSO 1: Quests Atuais Fase 5' as "===";
SELECT
  q.id,
  q.order_index,
  q.name,
  q.status,
  q.duration_minutes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
ORDER BY q.order_index;

---

-- PASSO 2: Verificar duplicatas
-- Resultado esperado: 1 quest por order_index (total = 1)
SELECT 'PASSO 2: Duplicatas? (Count deve ser 1 para cada)' as "===";
SELECT
  q.order_index,
  COUNT(*) as total_quests,
  STRING_AGG(q.id::text, ' | ') as ids,
  STRING_AGG(q.name, ' | ') as names
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
GROUP BY q.order_index
ORDER BY q.order_index;

---

-- PASSO 3: Verificar ID específico do erro (08c66a66-a297-4f83-8483-9c9d1848e372)
-- Resultado esperado: Uma linha mostrando os dados, ou vazio se não existe
SELECT 'PASSO 3: ID do Erro (08c66a66-a297-4f83-8483-9c9d1848e372)' as "===";
SELECT
  q.id,
  q.name,
  q.status,
  q.order_index,
  q.phase_id,
  q.duration_minutes
FROM quests q
WHERE q.id = '08c66a66-a297-4f83-8483-9c9d1848e372';

---

-- PASSO 4: Teste UPDATE em Quest 5.3
-- Resultado esperado: 1 linha mostrando id, name, status='active', started_at=NOW()
SELECT 'PASSO 4: Teste UPDATE em Quest 5.3' as "===";
WITH quest_5_3 AS (
  SELECT id FROM quests
  WHERE order_index = 3
    AND phase_id = (SELECT id FROM phases WHERE order_index = 5)
  LIMIT 1
)
UPDATE quests
SET status = 'active', started_at = NOW()
WHERE id = (SELECT id FROM quest_5_3)
RETURNING id, name, status, started_at;

---

-- PASSO 5: Comparação 5.2 vs 5.3
-- Resultado esperado: Mostrar lado-a-lado 5.2 (funciona) vs 5.3 (falha)
SELECT 'PASSO 5: Comparação 5.2 (OK) vs 5.3 (Falha)' as "===";
SELECT
  q2.id as "5.2_id",
  q2.name as "5.2_name",
  q2.status as "5.2_status",
  q3.id as "5.3_id",
  q3.name as "5.3_name",
  q3.status as "5.3_status"
FROM (
  SELECT * FROM quests
  WHERE order_index = 2
    AND phase_id = (SELECT id FROM phases WHERE order_index = 5)
) q2
FULL OUTER JOIN (
  SELECT * FROM quests
  WHERE order_index = 3
    AND phase_id = (SELECT id FROM phases WHERE order_index = 5)
) q3 ON true;

---

-- PASSO 6: Schema da tabela quests
-- Resultado esperado: Lista de todas as colunas e seus tipos
SELECT 'PASSO 6: Schema Completo da Tabela Quests' as "===";
SELECT
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'quests'
ORDER BY ordinal_position;

---

-- PASSO 7: RLS Policies
-- Resultado esperado: Lista de todas as políticas RLS
SELECT 'PASSO 7: RLS Policies na Tabela Quests' as "===";
SELECT
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'quests'
ORDER BY policyname;
