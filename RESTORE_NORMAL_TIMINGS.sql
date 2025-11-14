-- ============================================================================
-- RESTORE NORMAL TIMINGS (From Quick Test to Production)
-- ============================================================================
-- Este script restaura os tempos normais do evento:
-- 1. Late submission window: 1 min → 15 min
-- 2. Phase durations: Test (8 min) → Normal (~75 min)
-- 3. Quest durations: Test (2 min) → Normal (20-25 min)
-- 4. Phase 5: Test (6 min) → Normal (60 min)
-- 5. Phase 5: Sem boss (correto!)
-- ============================================================================

-- =========================
-- PARTE 1: LATE SUBMISSION WINDOW
-- =========================
-- Muda de 0.5 min (30 seg) para 15 minutos
-- Aplicado a todas as quests de Fases 1-5

UPDATE quests
SET late_submission_window_minutes = 15
WHERE phase_id IN (
  SELECT id FROM phases WHERE order_index BETWEEN 1 AND 5
);

-- =========================
-- PARTE 2: PHASES 1-4 - TIMINGS NORMAIS
-- =========================
-- Baseado no planejamento HTML oficial

UPDATE phases SET duration_minutes = 150 WHERE order_index = 1;  -- 2h30min
UPDATE phases SET duration_minutes = 210 WHERE order_index = 2;  -- 3h30min
UPDATE phases SET duration_minutes = 150 WHERE order_index = 3;  -- 2h30min
UPDATE phases SET duration_minutes = 120 WHERE order_index = 4;  -- 2h

-- =========================
-- PARTE 3: PHASE 5 - TIMINGS NORMAIS
-- =========================
-- Phase 5 é mais curta: 90 minutos total (SEM BOSS)

UPDATE phases SET duration_minutes = 90 WHERE order_index = 5;  -- 1h30min

-- =========================
-- PARTE 4: QUESTS PHASES 1-4 - TIMINGS NORMAIS
-- =========================
-- Baseado no planejamento HTML oficial
-- Fases 1-4 têm boss (Quest 4 = 10 min cada)
-- Fase 1: 60+50+30+10 = 150min
-- Fase 2: 50+30+120+10 = 210min
-- Fase 3: 40+30+70+10 = 150min
-- Fase 4: 40+40+30+10 = 120min

-- Fase 1 (2h30min total)
-- Quest 1.1: 60min, 1.2: 50min, 1.3: 30min, 1.4 BOSS: 10min
UPDATE quests
SET duration_minutes = 60, planned_deadline_minutes = 60
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 1;

UPDATE quests
SET duration_minutes = 50, planned_deadline_minutes = 50
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 2;

UPDATE quests
SET duration_minutes = 30, planned_deadline_minutes = 30
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 3;

UPDATE quests
SET duration_minutes = 10, planned_deadline_minutes = 10
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 4;  -- BOSS

-- Fase 2 (3h30min total)
-- Quest 2.1: 50min, 2.2: 30min, 2.3: 120min, 2.4 BOSS: 10min
UPDATE quests
SET duration_minutes = 50, planned_deadline_minutes = 50
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 1;

UPDATE quests
SET duration_minutes = 30, planned_deadline_minutes = 30
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 2;

UPDATE quests
SET duration_minutes = 120, planned_deadline_minutes = 120
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 3;

UPDATE quests
SET duration_minutes = 10, planned_deadline_minutes = 10
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 4;  -- BOSS

-- Fase 3 (2h30min total)
-- Quest 3.1: 40min, 3.2: 30min, 3.3: 70min, 3.4 BOSS: 10min
UPDATE quests
SET duration_minutes = 40, planned_deadline_minutes = 40
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3)
  AND order_index = 1;

UPDATE quests
SET duration_minutes = 30, planned_deadline_minutes = 30
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3)
  AND order_index = 2;

UPDATE quests
SET duration_minutes = 70, planned_deadline_minutes = 70
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3)
  AND order_index = 3;

UPDATE quests
SET duration_minutes = 10, planned_deadline_minutes = 10
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3)
  AND order_index = 4;  -- BOSS

-- Fase 4 (2h total)
-- Quest 4.1: 40min, 4.2: 40min, 4.3: 30min, 4.4 BOSS: 10min
UPDATE quests
SET duration_minutes = 40, planned_deadline_minutes = 40
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4)
  AND order_index = 1;

UPDATE quests
SET duration_minutes = 40, planned_deadline_minutes = 40
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4)
  AND order_index = 2;

UPDATE quests
SET duration_minutes = 30, planned_deadline_minutes = 30
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4)
  AND order_index = 3;

UPDATE quests
SET duration_minutes = 10, planned_deadline_minutes = 10
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4)
  AND order_index = 4;  -- BOSS

-- =========================
-- PARTE 5: PHASE 5 - TIMINGS NORMAIS (SEM BOSS)
-- =========================
-- Phase 5 tem 3 quests (sem boss)
-- Total: 90 minutos (1h30min)
-- Distribuição: Quest 1 (20 min), Quest 2 (40 min), Quest 3 (30 min)

UPDATE quests
SET duration_minutes = 20, planned_deadline_minutes = 20
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5)
  AND order_index = 1;

UPDATE quests
SET duration_minutes = 40, planned_deadline_minutes = 40
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5)
  AND order_index = 2;

UPDATE quests
SET duration_minutes = 30, planned_deadline_minutes = 30
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5)
  AND order_index = 3;

-- =========================
-- VERIFICAÇÃO: FASES ATUALIZADAS
-- =========================
SELECT '✅ PHASES AFTER UPDATE' as resultado;
SELECT
  p.order_index as fase,
  p.name,
  p.duration_minutes,
  COUNT(q.id) as num_quests,
  SUM(q.max_points) as total_points
FROM phases p
LEFT JOIN quests q ON q.phase_id = p.id
WHERE p.order_index BETWEEN 1 AND 5
GROUP BY p.id, p.order_index, p.name, p.duration_minutes
ORDER BY p.order_index;

-- =========================
-- VERIFICAÇÃO: QUESTS ATUALIZADAS
-- =========================
SELECT '📋 QUESTS AFTER UPDATE' as resultado;
SELECT
  p.order_index as phase,
  q.order_index as quest,
  LEFT(q.name, 35) as quest_name,
  q.duration_minutes,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes as late_window_min,
  q.max_points
FROM phases p
JOIN quests q ON q.phase_id = p.id
WHERE p.order_index BETWEEN 1 AND 5
ORDER BY p.order_index, q.order_index;

-- =========================
-- RESUMO DO QUE FOI ALTERADO
-- =========================
SELECT '📊 SUMMARY OF CHANGES' as resultado;
SELECT
  'Late submission window (all phases)' as change_description,
  '0.5 minutes (30 sec)' as old_value,
  '15 minutes' as new_value
UNION ALL
SELECT
  'Phase 1 duration',
  '8 minutes (TEST)',
  '150 minutes (2h30min)'
UNION ALL
SELECT
  'Phase 2 duration',
  '8 minutes (TEST)',
  '210 minutes (3h30min)'
UNION ALL
SELECT
  'Phase 3 duration',
  '8 minutes (TEST)',
  '150 minutes (2h30min)'
UNION ALL
SELECT
  'Phase 4 duration',
  '8 minutes (TEST)',
  '120 minutes (2h)'
UNION ALL
SELECT
  'Phase 5 duration',
  '6 minutes (TEST)',
  '90 minutes (1h30min)'
UNION ALL
SELECT
  'Total Event Duration',
  '~45 minutes (TEST)',
  '~720 minutes (12 hours)'
UNION ALL
SELECT
  'Phase 5 structure',
  '3 quests (SEM BOSS)',
  '3 quests (SEM BOSS - CONFIRMADO)'
UNION ALL
SELECT
  'Phases 1-4 structure',
  '4 quests each (with BOSS)',
  '4 quests each (with BOSS - 10min cada)';
