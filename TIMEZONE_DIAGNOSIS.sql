-- Diagnóstico: Timezone pode ter causado boss ativar?
-- Execute no Supabase SQL Editor

SELECT 
  '⏱️ TIMEZONE ANALYSIS' as section,
  'Server NOW()' as item,
  NOW()::text as "Server Time (UTC)"

UNION ALL

SELECT 
  '⏱️ TIMEZONE ANALYSIS',
  'Quest 1.1 started_at',
  (SELECT started_at::text FROM quests q 
   JOIN phases p ON q.phase_id = p.id 
   WHERE p.order_index = 1 AND q.order_index = 1)

UNION ALL

SELECT 
  '⏱️ TIMEZONE ANALYSIS',
  'Elapsed minutes',
  ROUND(
    EXTRACT(EPOCH FROM (NOW() - 
      (SELECT started_at FROM quests q 
       JOIN phases p ON q.phase_id = p.id 
       WHERE p.order_index = 1 AND q.order_index = 1)
    )) / 60
  )::text

UNION ALL

SELECT 
  '⏱️ TIMEZONE ANALYSIS',
  'Quest 1.1 duration (min)',
  (SELECT planned_deadline_minutes::text FROM quests q 
   JOIN phases p ON q.phase_id = p.id 
   WHERE p.order_index = 1 AND q.order_index = 1)

UNION ALL

SELECT 
  '⏱️ TIMEZONE ANALYSIS',
  'Late submission window (min)',
  (SELECT COALESCE(late_submission_window_minutes, 0)::text FROM quests q 
   JOIN phases p ON q.phase_id = p.id 
   WHERE p.order_index = 1 AND q.order_index = 1)

UNION ALL

SELECT 
  '⏱️ TIMEZONE ANALYSIS',
  'Total duration with late window',
  (
    SELECT (planned_deadline_minutes + COALESCE(late_submission_window_minutes, 0))::text 
    FROM quests q 
    JOIN phases p ON q.phase_id = p.id 
    WHERE p.order_index = 1 AND q.order_index = 1
  )

UNION ALL

SELECT 
  '⏱️ TIMEZONE ANALYSIS',
  'Quest EXPIROU?',
  CASE 
    WHEN NOW() > (
      SELECT started_at + 
        (planned_deadline_minutes * INTERVAL '1 minute') + 
        (COALESCE(late_submission_window_minutes, 0) * INTERVAL '1 minute')
      FROM quests q 
      JOIN phases p ON q.phase_id = p.id 
      WHERE p.order_index = 1 AND q.order_index = 1
    ) THEN 'SIM ⚠️'
    ELSE 'NÃO ✅'
  END

UNION ALL

SELECT 
  '🔍 TIMEZONE OFFSET',
  'Client timezone offset (hours)',
  '-3 (BRT) ou igual ao seu computador'

UNION ALL

SELECT 
  '🔍 TIMEZONE OFFSET',
  'Database timezone',
  'UTC (sem offset)'

UNION ALL

SELECT 
  '💡 CONCLUSÃO',
  'Timezone diferença?',
  'Dados armazenados em UTC, cálculos em UTC. Sem diferença.'
;
