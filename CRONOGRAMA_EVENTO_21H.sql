-- =====================================================
-- CRONOGRAMA COMPLETO DO EVENTO - INICIANDO 21:00 BRT
-- =====================================================

WITH quest_timeline AS (
  SELECT 
    p.order_index as phase_idx,
    p.name as phase_name,
    q.order_index as quest_idx,
    q.name as quest_name,
    q.duration_minutes,
    CASE WHEN q.deliverable_type ILIKE '%presentation%' THEN 'BOSS' ELSE 'Normal' END as tipo,
    
    -- Calcular tempo acumulado até este ponto (em minutos)
    SUM(q.duration_minutes) OVER (ORDER BY p.order_index, q.order_index) - q.duration_minutes as inicio_acum,
    SUM(q.duration_minutes) OVER (ORDER BY p.order_index, q.order_index) as fim_acum
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  ORDER BY p.order_index, q.order_index
)
SELECT 
  phase_idx as "F",
  quest_idx as "Q",
  quest_name as "Quest",
  tipo as "Tipo",
  duration_minutes as "Min",
  
  -- Horário de início (21:00 BRT + minutos acumulados)
  TO_CHAR(
    TIMESTAMP '2025-11-21 21:00:00' + (inicio_acum || ' minutes')::INTERVAL,
    'HH24:MI'
  ) as "Início",
  
  -- Horário de término
  TO_CHAR(
    TIMESTAMP '2025-11-21 21:00:00' + (fim_acum || ' minutes')::INTERVAL,
    'HH24:MI'
  ) as "Término"
FROM quest_timeline
ORDER BY phase_idx, quest_idx;

-- Sumário final
SELECT '═════════════════════════════════════' as "INFO";

SELECT 
  '🎬 EVENTO COMEÇA' as "Status",
  '21:00 BRT' as "Horário",
  '21 NOV 2025' as "Data"

UNION ALL

SELECT 
  '🏁 EVENTO TERMINA',
  TO_CHAR(
    TIMESTAMP '2025-11-21 21:00:00' + INTERVAL '740 minutes',
    'HH24:MI BRT'
  ),
  '22 NOV 2025'

UNION ALL

SELECT 
  '⏱️ DURAÇÃO TOTAL',
  '12 horas 20 minutos',
  '740 minutos'

UNION ALL

SELECT 
  '📊 ESTRUTURA',
  'Fases 1-4: 3 quests + 1 boss (10 min)',
  'Fase 5: 3 quests + 20 min avaliação';
