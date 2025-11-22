-- ========================================
-- AJUSTAR DURAÇÃO DAS QUESTS 4.1 E 4.2 PARA 30 MINUTOS
-- ========================================
-- Data: 2025-11-22
-- Objetivo: Reduzir de 40min para 30min cada quest
-- IMPORTANTE: Executar ANTES de ativar as quests 4.1 e 4.2

-- ========================================
-- PASSO 1: Verificar estado atual das quests 4.1 e 4.2
-- ========================================
SELECT 
  '=== ESTADO ATUAL DAS QUESTS 4.1 E 4.2 ===' as info;

SELECT 
  q.id,
  p.order_index || '.' || q.order_index as quest_numero,
  q.name,
  q.status,
  q.started_at,
  q.duration_minutes,
  q.planned_deadline_minutes,
  CASE 
    WHEN q.started_at IS NULL THEN '✅ SEGURO AJUSTAR (não iniciada)'
    WHEN q.status = 'scheduled' THEN '✅ SEGURO AJUSTAR (agendada)'
    ELSE '⚠️ CUIDADO (já ativa ou fechada)'
  END as pode_ajustar
FROM quests q
JOIN phases p ON p.id = q.phase_id
WHERE p.order_index = 4
  AND q.order_index IN (1, 2)
ORDER BY q.order_index;

-- ========================================
-- PASSO 2: AJUSTAR DURAÇÃO PARA 30 MINUTOS
-- ========================================
-- EXECUTAR APENAS SE AS QUESTS AINDA NÃO FORAM INICIADAS

UPDATE quests
SET 
  duration_minutes = 30,
  planned_deadline_minutes = 30
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4)
  AND order_index IN (1, 2)
  AND started_at IS NULL; -- Só ajustar se não foi iniciada

-- ========================================
-- PASSO 3: Verificar ajuste aplicado
-- ========================================
SELECT 
  '=== APÓS AJUSTE ===' as info;

SELECT 
  q.id,
  p.order_index || '.' || q.order_index as quest_numero,
  q.name,
  q.duration_minutes as duracao_min,
  q.planned_deadline_minutes as deadline_min,
  CASE 
    WHEN q.duration_minutes = 30 AND q.planned_deadline_minutes = 30 
    THEN '✅ AJUSTE CORRETO'
    ELSE '❌ VERIFICAR'
  END as status_ajuste
FROM quests q
JOIN phases p ON p.id = q.phase_id
WHERE p.order_index = 4
  AND q.order_index IN (1, 2)
ORDER BY q.order_index;

-- ========================================
-- PASSO 4: Calcular novo timing da Fase 4
-- ========================================
SELECT 
  '=== TIMING TOTAL DA FASE 4 ===' as info;

SELECT 
  p.order_index as fase,
  p.name as nome_fase,
  COUNT(q.id) as total_quests,
  SUM(q.duration_minutes) as duracao_total_minutos,
  SUM(q.duration_minutes) / 60.0 as duracao_total_horas,
  string_agg(
    p.order_index || '.' || q.order_index || ': ' || q.duration_minutes || 'min',
    ' + '
    ORDER BY q.order_index
  ) as detalhamento
FROM quests q
JOIN phases p ON p.id = q.phase_id
WHERE p.order_index = 4
GROUP BY p.order_index, p.name;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- ANTES:
-- Quest 4.1: 40 min
-- Quest 4.2: 40 min
-- BOSS 4.3: 10 min
-- Total: 90 min (1h30)
--
-- DEPOIS:
-- Quest 4.1: 30 min
-- Quest 4.2: 30 min
-- BOSS 4.3: 10 min
-- Total: 70 min (1h10)
--
-- ECONOMIA: 20 minutos na Fase 4

-- ========================================
-- SEGURANÇA
-- ========================================
-- ✅ SEGURO se quests ainda não foram iniciadas (started_at IS NULL)
-- ✅ SEGURO se quests estão com status 'scheduled'
-- ❌ NÃO AJUSTAR se quest já está ativa (causaria confusão no cronômetro)
-- ❌ NÃO AJUSTAR se quest já foi fechada (alteraria histórico)
