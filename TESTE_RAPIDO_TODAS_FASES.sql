-- ============================================================================
-- TESTE RÁPIDO - TODAS AS FASES COM 2 MINUTOS CADA QUEST
-- ============================================================================
-- Objetivo: Modo teste rápido
-- - Fases 1-4: 3 quests de 2 min + 1 BOSS de 2 min = 8 min total cada
-- - Fase 5: 3 quests de 2 min = 6 min total
-- - Late submission window: 30 segundos
-- - Evaluation period: 1 minuto (60 seg)
-- - Game Over countdown: 10 segundos (já está na página)
-- ============================================================================

-- PASSO 1: Atualizar FASE 1
UPDATE phases
SET duration_minutes = 8
WHERE order_index = 1;

-- Atualizar quests da Fase 1 (3 quests digitais + 1 BOSS)
UPDATE quests
SET duration_minutes = 2, planned_deadline_minutes = 2, late_submission_window_minutes = 0.5
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index IN (1, 2, 3, 4);

-- PASSO 2: Atualizar FASE 2
UPDATE phases
SET duration_minutes = 8
WHERE order_index = 2;

-- Atualizar quests da Fase 2 (3 quests digitais + 1 BOSS)
UPDATE quests
SET duration_minutes = 2, planned_deadline_minutes = 2, late_submission_window_minutes = 0.5
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index IN (1, 2, 3, 4);

-- PASSO 3: Atualizar FASE 3
UPDATE phases
SET duration_minutes = 8
WHERE order_index = 3;

-- Atualizar quests da Fase 3 (3 quests digitais + 1 BOSS)
UPDATE quests
SET duration_minutes = 2, planned_deadline_minutes = 2, late_submission_window_minutes = 0.5
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3)
  AND order_index IN (1, 2, 3, 4);

-- PASSO 4: Atualizar FASE 4
UPDATE phases
SET duration_minutes = 8
WHERE order_index = 4;

-- Atualizar quests da Fase 4 (3 quests digitais + 1 BOSS)
UPDATE quests
SET duration_minutes = 2, planned_deadline_minutes = 2, late_submission_window_minutes = 0.5
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4)
  AND order_index IN (1, 2, 3, 4);

-- PASSO 5: Atualizar FASE 5 (já está corrigida do script anterior, mas refazemos para garantir)
UPDATE phases
SET duration_minutes = 6
WHERE order_index = 5;

-- Atualizar quests da Fase 5 (3 quests digitais apenas - SEM BOSS)
UPDATE quests
SET duration_minutes = 2, planned_deadline_minutes = 2, late_submission_window_minutes = 0.5
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5)
  AND order_index IN (1, 2, 3);

-- PASSO 6: VERIFICAR RESULTADO
SELECT '✅ TESTE RÁPIDO - VERIFICAÇÃO DE FASES' as resultado;

SELECT
  p.order_index as fase,
  p.name as phase_name,
  p.duration_minutes as fase_duration,
  COUNT(q.id) as total_quests,
  SUM(q.max_points) as total_points,
  STRING_AGG(CAST(q.duration_minutes AS TEXT), ', ' ORDER BY q.order_index) as quest_durations
FROM phases p
LEFT JOIN quests q ON q.phase_id = p.id
WHERE p.order_index BETWEEN 1 AND 5
GROUP BY p.id, p.order_index, p.name, p.duration_minutes
ORDER BY p.order_index;

-- PASSO 7: VERIFICAR DETALHES DE CADA QUEST
SELECT '📋 DETALHES DE CADA QUEST - TESTE RÁPIDO' as resultado;

SELECT
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.max_points,
  q.duration_minutes,
  q.late_submission_window_minutes,
  array_to_string(q.deliverable_type::text[], ', ') as tipo
FROM phases p
JOIN quests q ON q.phase_id = p.id
WHERE p.order_index BETWEEN 1 AND 5
ORDER BY p.order_index, q.order_index;

-- PASSO 8: RESUMO TIMELINE TESTE
SELECT '⏱️ TIMELINE TESTE RÁPIDO (TOTAL ~43 MINUTOS)' as resultado;

SELECT 'Fase 1: 0min-8min (3+1 quests de 2min)' as timeline
UNION ALL
SELECT 'Fase 2: 8min-16min (3+1 quests de 2min)'
UNION ALL
SELECT 'Fase 3: 16min-24min (3+1 quests de 2min)'
UNION ALL
SELECT 'Fase 4: 24min-32min (3+1 quests de 2min)'
UNION ALL
SELECT 'Fase 5: 32min-38min (3 quests de 2min, SEM BOSS)'
UNION ALL
SELECT 'Evaluation Period: 38min-39min (1 minuto)'
UNION ALL
SELECT 'Game Over: 39min-39m10s (10 segundos countdown na página)'
UNION ALL
SELECT 'Total: ~39 minutos 10 segundos';
