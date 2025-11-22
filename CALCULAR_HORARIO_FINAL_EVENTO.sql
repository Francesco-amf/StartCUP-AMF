-- VERIFICAR LÓGICA COMPLETA DO EVENTO
-- =====================================================
-- Quest 5.3 termina + 15 min (late submission) + 20 min (avaliação) = FIM

-- 1. Duração de Quest 5.3
SELECT 
  p.name as "Phase",
  q.order_index as "Quest",
  q.name,
  q.duration_minutes as "Duration",
  q.late_submission_window_minutes as "Late Window",
  q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0) as "Total (dur + late)"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5 AND q.order_index = 3;

-- 2. Todas as quests + late window
SELECT 
  p.order_index as "Phase",
  q.order_index as "Quest",
  q.name,
  q.duration_minutes,
  q.late_submission_window_minutes,
  q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0) as "Total com late"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index != 4  -- Excluir bosses (são paralelos, não sequenciais)
ORDER BY p.order_index, q.order_index;

-- 3. CALCULAR TEMPO TOTAL
WITH quest_times AS (
  SELECT 
    p.order_index as phase_idx,
    q.order_index as quest_idx,
    q.name,
    q.duration_minutes,
    COALESCE(q.late_submission_window_minutes, 0) as late_minutes,
    q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0) as quest_total
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE q.order_index != 4  -- Sem bosses
),
total_calc AS (
  SELECT 
    SUM(quest_total) as total_quests_minutes,
    20 as evaluation_window,
    SUM(quest_total) + 20 as event_total_minutes
  FROM quest_times
)
SELECT 
  total_quests_minutes as "Tempo todas quests + late",
  evaluation_window as "Janela avaliação (20 min)",
  event_total_minutes as "TOTAL EVENTO (minutos)",
  event_total_minutes / 60.0 as "TOTAL (horas)",
  event_total_minutes / 60 || ' horas ' || (event_total_minutes % 60) || ' minutos' as "Formato legível"
FROM total_calc;

-- 4. HORÁRIO DE TÉRMINO
-- Evento começa: 21:00 BRT (dia 21) = 00:00 UTC (dia 22)
WITH timeline AS (
  SELECT 
    '2025-11-22 00:00:00'::timestamp as event_start_utc,
    (
      SELECT SUM(q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0)) + 20
      FROM quests q
      JOIN phases p ON q.phase_id = p.id
      WHERE q.order_index != 4
    ) as total_minutes
)
SELECT 
  event_start_utc as "Início (UTC)",
  (event_start_utc + (total_minutes || ' minutes')::interval) as "FIM (UTC)",
  to_char((event_start_utc + (total_minutes || ' minutes')::interval), 'YYYY-MM-DD HH24:MI:SS') as "Formato SQL",
  (event_start_utc + (total_minutes || ' minutes')::interval - INTERVAL '3 hours') as "FIM (BRT)",
  to_char((event_start_utc + (total_minutes || ' minutes')::interval - INTERVAL '3 hours'), 'HH24:MI:SS') as "Horário BRT"
FROM timeline;

-- 5. RESUMO DETALHADO
SELECT 
  '🟢 EVENTO COMEÇA' as "Evento",
  '21:00 BRT (21 nov)' as "Horário",
  '00:00 UTC (22 nov)' as "UTC"

UNION ALL

SELECT 
  '⏱️ FASES 1-4 com BOSSES' as "Evento",
  'Sequential (bosses não contam)' as "Horário",
  'Rodando em paralelo' as "UTC"

UNION ALL

SELECT 
  '🎯 FASE 5 FINAL' as "Evento",
  'Quest 5.1 → 5.2 → 5.3' as "Horário",
  'Sequencial' as "UTC"

UNION ALL

SELECT 
  '⏰ QUEST 5.3 TERMINA' as "Evento",
  'Último envio (com 15 min late)' as "Horário",
  'Deadline para submissão' as "UTC"

UNION ALL

SELECT 
  '📋 JANELA DE AVALIAÇÃO' as "Evento",
  '+20 minutos' as "Horário",
  'Tempo para avaliar' as "UTC"

UNION ALL

SELECT 
  '🔴 EVENTO TERMINA' as "Evento",
  'Quest 5.3 + 15 min + 20 min' as "Horário",
  'HORÁRIO FINAL' as "UTC";
