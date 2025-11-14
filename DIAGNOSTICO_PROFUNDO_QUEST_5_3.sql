-- ============================================================================
-- DIAGNÓSTICO PROFUNDO: Por que Quest 5.3 continua falhando?
-- ============================================================================

-- PASSO 1: Verificar se Quest 5.3 com esse ID específico existe
SELECT 'PASSO 1: Quest 5.3 Específica (ID do erro)' as "===";
SELECT
  q.id,
  q.phase_id,
  q.order_index,
  q.name,
  q.status,
  q.duration_minutes,
  q.started_at,
  q.ended_at
FROM quests q
WHERE q.id = '08c66a66-a297-4f83-8483-9c9d1848e372';

-- PASSO 2: Verificar TODAS as quests da Fase 5
SELECT 'PASSO 2: Todas as Quests Fase 5' as "===";
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

-- PASSO 3: Verificar se há DUPLICATAS (duas quests com mesmo order_index)
SELECT 'PASSO 3: Verificar Duplicatas na Fase 5' as "===";
SELECT
  q.order_index,
  COUNT(*) as total,
  STRING_AGG(q.id::text, ', ') as ids,
  STRING_AGG(q.name, ', ') as names
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
GROUP BY q.order_index
ORDER BY q.order_index;

-- PASSO 4: Verificar dados estranhos (como NULL em colunas importantes)
SELECT 'PASSO 4: Quests com dados estranhos/NULL' as "===";
SELECT
  q.id,
  q.order_index,
  q.name,
  q.status,
  q.phase_id,
  q.started_at,
  q.ended_at,
  q.deliverable_type,
  q.max_points
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
  AND (q.phase_id IS NULL OR q.order_index IS NULL OR q.name IS NULL)
ORDER BY q.order_index;

-- PASSO 5: Testar UPDATE manual na Quest 5.3
SELECT 'PASSO 5: Teste de UPDATE Manual' as "===";
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

-- PASSO 6: Verificar RLS policies na tabela quests
SELECT 'PASSO 6: RLS Policies na Tabela Quests' as "===";
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'quests'
ORDER BY policyname;

-- PASSO 7: Verificar estrutura completa da tabela
SELECT 'PASSO 7: Schema Completo da Tabela Quests' as "===";
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_name = 'quests'
ORDER BY ordinal_position;

-- PASSO 8: Listar TUDO sobre Quest 5.2 (que funciona)
SELECT 'PASSO 8: Quest 5.2 (que funciona)' as "===";
SELECT
  q.id,
  q.order_index,
  q.name,
  q.status,
  q.duration_minutes,
  q.phase_id,
  q.started_at,
  q.ended_at
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
  AND q.order_index = 2;

-- PASSO 9: Comparar Schema de 5.2 vs 5.3 (linha por linha)
SELECT 'PASSO 9: Comparação 5.2 vs 5.3' as "===";
SELECT
  CASE WHEN q1.id IS NOT NULL THEN 'Quest 5.2' ELSE 'Quest 5.3' END as quest,
  q1.id as quest_5_2_id,
  q2.id as quest_5_3_id,
  q1.name as q5_2_name,
  q2.name as q5_3_name,
  q1.status as q5_2_status,
  q2.status as q5_3_status,
  q1.duration_minutes as q5_2_duration,
  q2.duration_minutes as q5_3_duration
FROM (
  SELECT * FROM quests
  WHERE order_index = 2
    AND phase_id = (SELECT id FROM phases WHERE order_index = 5)
) q1
FULL OUTER JOIN (
  SELECT * FROM quests
  WHERE order_index = 3
    AND phase_id = (SELECT id FROM phases WHERE order_index = 5)
) q2 ON true;
