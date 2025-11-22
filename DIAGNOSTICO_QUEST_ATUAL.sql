-- 🔍 DIAGNOSTICAR: Verificar quest atual no banco

SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "Iniciou Em",
  q.duration_minutes as "Duração (min)",
  q.planned_deadline_minutes as "Deadline Planejado (min)",
  q.late_submission_window_minutes as "Janela Atraso (min)",
  CASE 
    WHEN q.started_at IS NOT NULL THEN
      q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')
    ELSE NULL
  END as "Expira Em",
  CASE 
    WHEN q.started_at IS NOT NULL THEN
      q.started_at + ((q.planned_deadline_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute')
    ELSE NULL
  END as "Expira Final (com atraso)"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- Quest que deveria estar ativa AGORA:
SELECT 
  q.order_index,
  q.name,
  q.status,
  CASE 
    WHEN q.status = 'active' THEN '✅ ATIVA'
    WHEN q.status = 'scheduled' THEN '⏰ AGENDADA'
    WHEN q.status = 'closed' THEN '🔒 FECHADA'
    ELSE '❓ ' || q.status
  END as "Estado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
  AND q.status = 'active';
