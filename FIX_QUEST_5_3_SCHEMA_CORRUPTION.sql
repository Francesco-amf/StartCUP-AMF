-- ============================================================================
-- FIX: Quest 5.3 Schema Corruption - DELETE and RECREATE with Correct Columns
-- ============================================================================
-- Problem: Quest 5.3 was created with columns that don't exist (created_at, updated_at)
-- This causes "UPDATE requires a WHERE clause" error when trying to activate it
-- ============================================================================

-- PASSO 1: Verificar schema atual da tabela quests
SELECT 'PASSO 1: Schema da Tabela Quests' as "===";
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'quests'
ORDER BY ordinal_position;

-- PASSO 2: Encontrar Quest 5.3 corrompida (a que está falhando)
SELECT 'PASSO 2: Quest 5.3 Atual (Corrompida)' as "===";
SELECT
  q.id,
  q.phase_id,
  q.order_index,
  q.name,
  q.status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
AND q.order_index = 3;

-- PASSO 3: DELETAR Quest 5.3 corrompida
SELECT 'PASSO 3: Deletando Quest 5.3 Corrompida' as "===";
DELETE FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5)
AND order_index = 3;

-- PASSO 4: Verificar que foi deletado
SELECT 'PASSO 4: Verificando Deleção' as "===";
SELECT COUNT(*) as quests_fase5
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5;

-- PASSO 5: Recriar Quest 5.3 com APENAS colunas corretas
-- Baseado no schema do endpoint advance-quest que usa: status, started_at, ended_at
SELECT 'PASSO 5: Recriando Quest 5.3' as "===";

WITH phase_5 AS (
  SELECT id FROM phases WHERE order_index = 5
)
INSERT INTO quests (
  id,
  phase_id,
  order_index,
  name,
  description,
  status,
  deliverable_type,
  max_points,
  duration_minutes,
  planned_deadline_minutes,
  late_submission_window_minutes
)
SELECT
  gen_random_uuid(),
  p.id,
  3,
  '5.3 - Ensaio Geral',
  'Treinar pitch e ajustar timing',
  'pending',
  'file',
  25,
  2,
  2,
  1
FROM phase_5 p
WHERE NOT EXISTS (
  SELECT 1 FROM quests q
  WHERE q.phase_id = p.id
  AND q.order_index = 3
)
RETURNING id, name, order_index, status;

-- PASSO 6: Verificar todas as quests da Fase 5
SELECT 'PASSO 6: Verificação Final - Todas as Quests Fase 5' as "===";
SELECT
  q.id,
  q.order_index,
  q.name,
  q.status,
  q.phase_id
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
ORDER BY q.order_index;

-- PASSO 7: Verificar que a nova Quest 5.3 pode ser atualizada
SELECT 'PASSO 7: Testando UPDATE na Nova Quest 5.3' as "===";
WITH quest_5_3 AS (
  SELECT id FROM quests
  WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5)
  AND order_index = 3
)
UPDATE quests
SET status = 'active', started_at = NOW()
WHERE id = (SELECT id FROM quest_5_3)
RETURNING id, name, status, started_at;
