-- ============================================================================
-- DELETE a Quest 5.3 antiga e RECRIAR com nome e duração corretos
-- ============================================================================

-- PASSO 1: Deletar Quest 5.3 antiga
SELECT 'PASSO 1: Deletando Quest 5.3 Antiga' as "===";
DELETE FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5)
AND order_index = 3;

-- PASSO 2: Verificar que foi deletado (deve mostrar 2 quests apenas)
SELECT 'PASSO 2: Verificando Deleção' as "===";
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

-- PASSO 3: Recriar Quest 5.3 com dados CORRETOS
SELECT 'PASSO 3: Recriando Quest 5.3' as "===";
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
  (SELECT id FROM phases WHERE order_index = 5),
  3,
  'Quest 5.3 - Ensaio Geral',
  'Treinar pitch e ajustar timing',
  'pending',
  'file',
  25,
  2,
  2,
  1
RETURNING id, name, order_index, duration_minutes, status;

-- PASSO 4: Verificação final - deve mostrar 3 quests com Quest 5.3 durando 2 min
SELECT 'PASSO 4: Verificação Final' as "===";
SELECT
  q.id,
  q.order_index,
  q.name,
  q.duration_minutes,
  q.status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
ORDER BY q.order_index;
