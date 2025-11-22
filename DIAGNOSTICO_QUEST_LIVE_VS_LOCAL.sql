-- 🔍 DIAGNÓSTICO: Verificar estado atual das quests

-- Ver qual quest está REALMENTE ativa no banco
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "Iniciou",
  q.duration_minutes as "Duração",
  q.planned_deadline_minutes as "Deadline Planejado",
  CASE 
    WHEN q.started_at IS NOT NULL THEN
      ROUND(EXTRACT(EPOCH FROM (NOW() - q.started_at)) / 60, 1)
    ELSE NULL
  END as "Min Decorridos",
  CASE 
    WHEN q.started_at IS NOT NULL AND q.duration_minutes IS NOT NULL THEN
      ROUND(EXTRACT(EPOCH FROM ((q.started_at + (q.duration_minutes * INTERVAL '1 minute')) - NOW())) / 60, 1)
    ELSE NULL
  END as "Min Restantes"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.status IN ('active', 'paused')
ORDER BY p.order_index, q.order_index;

-- Ver timestamp do servidor
SELECT NOW() as "Servidor UTC Agora";

-- Ver fase atual
SELECT current_phase as "Fase Atual" FROM event_config;
