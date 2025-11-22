-- ============================================================================
-- VERIFICAR HORÁRIOS CALCULADOS DOS BOSS
-- ============================================================================
-- Este script mostra quando cada BOSS vai ativar automaticamente
-- baseado na soma das durações das quests anteriores
-- ============================================================================

-- 🔍 VER CÁLCULO AUTOMÁTICO DE HORÁRIOS
WITH boss_timing AS (
  SELECT 
    p.order_index as fase,
    q.order_index as quest_order,
    q.name,
    q.duration_minutes,
    -- Soma das durações das quests ANTERIORES ao BOSS (order < 4)
    (
      SELECT COALESCE(SUM(q2.duration_minutes), 0)
      FROM quests q2
      WHERE q2.phase_id = q.phase_id
        AND q2.order_index < q.order_index
    ) as duracao_acumulada_antes,
    CASE p.order_index
      WHEN 1 THEN (SELECT phase_1_start_time FROM event_config LIMIT 1)
      WHEN 2 THEN (SELECT phase_2_start_time FROM event_config LIMIT 1)
      WHEN 3 THEN (SELECT phase_3_start_time FROM event_config LIMIT 1)
      WHEN 4 THEN (SELECT phase_4_start_time FROM event_config LIMIT 1)
      WHEN 5 THEN (SELECT phase_5_start_time FROM event_config LIMIT 1)
    END as phase_start
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE q.order_index = 4  -- Apenas BOSS
)
SELECT 
  fase as "Fase",
  quest_order as "Quest",
  name as "Nome BOSS",
  duration_minutes as "Duração (min)",
  duracao_acumulada_antes as "Acumulado Antes (min)",
  phase_start as "Fase Inicia",
  phase_start + (duracao_acumulada_antes * INTERVAL '1 minute') as "BOSS Inicia (calculado)",
  CASE 
    WHEN phase_start IS NULL THEN '⚠️ FASE NÃO INICIADA'
    WHEN NOW() >= phase_start + (duracao_acumulada_antes * INTERVAL '1 minute') THEN '✅ HORA CHEGOU'
    ELSE '⏰ FALTAM ' || 
         ROUND(EXTRACT(EPOCH FROM (
           (phase_start + (duracao_acumulada_antes * INTERVAL '1 minute')) - NOW()
         )) / 60) || ' min'
  END as "Status"
FROM boss_timing
ORDER BY fase;

-- ============================================================================
-- VER TODAS AS QUESTS DA FASE 1 COM HORÁRIOS
-- ============================================================================
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.duration_minutes as "Duração",
  (SELECT phase_1_start_time FROM event_config LIMIT 1) as "Fase Inicia",
  (SELECT phase_1_start_time FROM event_config LIMIT 1) + 
    (
      SELECT COALESCE(SUM(q2.duration_minutes), 0) * INTERVAL '1 minute'
      FROM quests q2
      WHERE q2.phase_id = q.phase_id
        AND q2.order_index < q.order_index
    ) as "Quest Inicia (calculado)",
  CASE 
    WHEN q.order_index = 4 THEN '🎯 BOSS'
    ELSE '📝 Normal'
  END as "Tipo"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;

-- ============================================================================
-- COMO FUNCIONA:
-- ============================================================================
-- O sistema calcula automaticamente quando o BOSS deve iniciar:
-- 
-- Fórmula: BOSS inicia em = phase_start_time + SOMA(duration das quests 1, 2, 3)
-- 
-- Exemplo Fase 1:
--   - Fase inicia: 14:00
--   - Quest 1.1: 30 min (14:00 - 14:30)
--   - Quest 1.2: 40 min (14:30 - 15:10)
--   - Quest 1.3: 30 min (15:10 - 15:40)
--   - BOSS 1.4: INICIA ÀS 15:40 (automaticamente!)
-- 
-- IMPORTANTE:
--   - Quest anterior pode terminar antes (ex: 1.3 termina às 15:20)
--   - BOSS NÃO ativa cedo (aguarda até 15:40)
--   - Quando chega 15:40, BOSS ativa sozinho
--   - Não precisa configurar nada manualmente!
-- ============================================================================
