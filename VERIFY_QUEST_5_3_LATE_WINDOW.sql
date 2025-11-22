-- VERIFICAR: Quest 5.3 + janela de 20 minutos
-- =====================================================

-- 1. Qual é a duration de Quest 5.3?
SELECT 
  p.name as "Phase",
  q.order_index,
  q.name,
  q.duration_minutes,
  q.late_submission_minutes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5 AND q.order_index = 3;

-- 2. Calcular timeline completa
-- =====================================================

-- Se evento começa 21:00 BRT (00:00 UTC dia 22)
-- E durações são:
-- - Quest 5.1: ? minutos
-- - Quest 5.2: ? minutos
-- - Quest 5.3: ? minutos
-- - Late window: 20 minutos

-- Timeline:
-- 00:00 UTC (21:00 BRT dia 21) = Fase 1 começa
-- ...
-- Fase 5 Quest 3 termina + 20 minutos = evento termina

-- Verificar duração de TODAS as quests
SELECT 
  p.order_index as "Phase",
  q.order_index as "Quest",
  q.name,
  q.duration_minutes,
  q.late_submission_minutes,
  CASE 
    WHEN q.late_submission_minutes IS NOT NULL 
    THEN q.duration_minutes + q.late_submission_minutes
    ELSE q.duration_minutes
  END as "Total com late window"
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- 3. Somar tempo total se forem SEQUENCIAIS
-- =====================================================

WITH quest_durations AS (
  SELECT 
    p.order_index as phase_idx,
    q.order_index as quest_idx,
    q.duration_minutes,
    q.late_submission_minutes,
    CASE 
      WHEN q.late_submission_minutes IS NOT NULL 
      THEN q.duration_minutes + q.late_submission_minutes
      ELSE q.duration_minutes
    END as total_with_late
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE q.order_index != 4 -- Excluir bosses (não são sequenciais com outras)
)
SELECT 
  SUM(total_with_late) as "Total minutos (sem bosses)",
  SUM(total_with_late) / 60.0 as "Total horas",
  '00:00 UTC 22-Nov'::timestamp + (SUM(total_with_late) * INTERVAL '1 minute') as "Evento termina em UTC"
FROM quest_durations;

-- 4. Verificar: Phase 5 Quest 3 tem late_submission_minutes = 20?
SELECT 
  p.name as "Phase",
  q.order_index,
  q.name,
  q.duration_minutes,
  q.late_submission_minutes,
  CASE 
    WHEN q.late_submission_minutes = 20 THEN '✅ Tem os 20 minutos'
    WHEN q.late_submission_minutes IS NULL THEN '❌ Sem late window'
    ELSE '⚠️ Late window = ' || q.late_submission_minutes
  END as "Status"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5 AND q.order_index = 3;
