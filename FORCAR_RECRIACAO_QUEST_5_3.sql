-- ============================================================================
-- FORÇAR RECRIAÇÃO COMPLETA DE QUEST 5.3
-- ============================================================================
-- Este script:
-- 1. Deleta TODAS as quests com order_index 3 na Fase 5
-- 2. Verifica se foi deletado completamente
-- 3. Reinsere uma nova Quest 5.3 com dados limpos
-- 4. Testa o UPDATE
-- ============================================================================

-- PASSO 1: Ver quests atuais
SELECT 'PASSO 1: Quests Atuais' as "===";
SELECT
  q.id,
  q.order_index,
  q.name,
  q.status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
ORDER BY q.order_index;

-- PASSO 2: DELETAR TODAS as quests com order_index 3 (forçado)
SELECT 'PASSO 2: Deletando Todas as Quests 5.3' as "===";
DELETE FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5)
  AND order_index = 3;

SELECT 'Deletadas!' as "===";

-- PASSO 3: Verificar que NÃO existe mais nenhuma quest com order_index 3
SELECT 'PASSO 3: Verificação - Deve estar vazio' as "===";
SELECT COUNT(*) as quests_5_3
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
  AND q.order_index = 3;

-- PASSO 4: RECRIAR Quest 5.3 com ID novo
SELECT 'PASSO 4: Recriando Quest 5.3' as "===";
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
VALUES (
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
)
RETURNING id, name, order_index, status;

-- PASSO 5: Verificar todas as quests novamente
SELECT 'PASSO 5: Verificação Final' as "===";
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

-- PASSO 6: Testar UPDATE na nova Quest 5.3
SELECT 'PASSO 6: Teste de UPDATE' as "===";
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

-- PASSO 7: Voltar Quest 5.3 para 'pending' (para próximo teste)
SELECT 'PASSO 7: Resetar para Pending' as "===";
UPDATE quests
SET status = 'pending', started_at = NULL
WHERE order_index = 3
  AND phase_id = (SELECT id FROM phases WHERE order_index = 5)
RETURNING id, name, status;
