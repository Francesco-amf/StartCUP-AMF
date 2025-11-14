-- ============================================================================
-- RECONSTRUÇÃO COMPLETA DA FASE 5 - VERSÃO SIMPLES
-- ============================================================================
-- Copie e execute TUDO de uma vez no Supabase SQL Editor
-- ============================================================================

-- PASSO 1: Deletar todas as quests da Fase 5
DELETE FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5);

-- PASSO 2: Deletar a Fase 5
DELETE FROM phases
WHERE order_index = 5;

-- PASSO 3: Recriar Fase 5
-- Primeiro descobrir o próximo ID disponível
INSERT INTO phases (id, order_index, name, duration_minutes, max_points)
VALUES (
  COALESCE((SELECT MAX(id) + 1 FROM phases), 6),
  5,
  'Fase 5: Pitch Final',
  150,
  1200
);

-- PASSO 4: Recriar Quest 5.1
INSERT INTO quests (
  id, phase_id, order_index, name, description, status,
  deliverable_type, max_points, duration_minutes,
  planned_deadline_minutes, late_submission_window_minutes
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM phases WHERE order_index = 5),
  1,
  'Quest 5.1 - A História Épica',
  'Contar a história de forma épica e engajante',
  'pending',
  'file', 30, 2, 2, 1
);

-- PASSO 5: Recriar Quest 5.2
INSERT INTO quests (
  id, phase_id, order_index, name, description, status,
  deliverable_type, max_points, duration_minutes,
  planned_deadline_minutes, late_submission_window_minutes
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM phases WHERE order_index = 5),
  2,
  'Quest 5.2 - Slides de Impacto',
  'Criar slides que demonstrem impacto e viabilidade',
  'pending',
  'file', 25, 2, 2, 1
);

-- PASSO 6: Recriar Quest 5.3
INSERT INTO quests (
  id, phase_id, order_index, name, description, status,
  deliverable_type, max_points, duration_minutes,
  planned_deadline_minutes, late_submission_window_minutes
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM phases WHERE order_index = 5),
  3,
  'Quest 5.3 - Ensaio Geral',
  'Treinar pitch e ajustar timing',
  'pending',
  'file', 25, 2, 2, 1
);

-- PASSO 7: Verificar resultado final
SELECT
  'RESULTADO FINAL' as "===",
  p.id as phase_id,
  p.order_index,
  p.name as phase_name,
  COUNT(q.id) as total_quests
FROM phases p
LEFT JOIN quests q ON q.phase_id = p.id
WHERE p.order_index = 5
GROUP BY p.id, p.order_index, p.name;

-- PASSO 8: Listar todas as quests recriadas
SELECT
  q.id,
  q.order_index,
  q.name,
  q.status,
  q.duration_minutes,
  q.max_points
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
ORDER BY q.order_index;
