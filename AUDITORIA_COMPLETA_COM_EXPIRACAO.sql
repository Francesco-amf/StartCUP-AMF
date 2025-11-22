-- 🔍 AUDITORIA DETALHADA: Verificar expiração de TODAS as quests

SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "Iniciou",
  q.duration_minutes as "Duração",
  q.planned_deadline_minutes as "Deadline",
  CASE 
    WHEN q.started_at IS NOT NULL AND q.planned_deadline_minutes IS NOT NULL THEN
      q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')
    ELSE NULL
  END as "Expira Em",
  CASE 
    WHEN q.started_at IS NOT NULL AND q.planned_deadline_minutes IS NOT NULL THEN
      NOW() > q.started_at + ((q.planned_deadline_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute')
    ELSE FALSE
  END as "Expirou?",
  CASE 
    WHEN q.duration_minutes = q.planned_deadline_minutes THEN '✅'
    WHEN q.planned_deadline_minutes IS NULL THEN '⚠️'
    ELSE '❌'
  END as "Sync",
  CASE 
    WHEN q.status = 'active' AND q.started_at IS NULL THEN '🚨 ATIVA SEM started_at'
    WHEN q.status = 'active' AND p.order_index < (SELECT current_phase FROM event_config LIMIT 1) THEN '🚨 ATIVA EM FASE PASSADA'
    WHEN q.status = 'closed' AND NOT (NOW() > q.started_at + ((q.planned_deadline_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute')) AND q.started_at IS NOT NULL THEN '🚨 FECHADA MAS NÃO EXPIROU'
    ELSE '✅'
  END as "Problema?"
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;
