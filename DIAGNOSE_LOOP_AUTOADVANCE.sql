-- ==========================================
-- DIAGNÓSTICO URGENTE: Loop de Auto-Advance
-- ==========================================
-- PROBLEMA: Quest avança e volta, loop entre 4.2 → 4.3 → Boss → 4.2 → 5.1
-- VERIFICAR: pg_cron jobs, condições de auto_advance
-- ==========================================

-- 1. Verificar jobs do pg_cron
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
ORDER BY jobid;

-- 2. Histórico de execuções recentes do pg_cron (últimas 50)
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 50;

-- 3. Ver estado ATUAL das quests da Fase 4
SELECT 
  'ESTADO ATUAL FASE 4' as tipo,
  q.name,
  q.order_index,
  q.status,
  q.started_at,
  q.planned_deadline_minutes,
  CASE 
    WHEN q.started_at IS NULL THEN 'Nunca iniciou'
    WHEN q.status = 'active' THEN 
      CASE 
        WHEN NOW() < (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL) THEN 'Dentro do prazo'
        ELSE 'EXPIRADO'
      END
    ELSE q.status
  END as situacao
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 4
ORDER BY q.order_index;

-- 4. Ver estado ATUAL das quests da Fase 5
SELECT 
  'ESTADO ATUAL FASE 5' as tipo,
  q.name,
  q.order_index,
  q.status,
  q.started_at,
  q.planned_deadline_minutes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
ORDER BY q.order_index;

-- 5. Verificar configuração do evento
SELECT 
  'CONFIG EVENTO' as tipo,
  event_started,
  current_phase,
  phase_4_start_time,
  phase_5_start_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- 6. Ver TODAS as quests ativas em TODAS as fases
SELECT 
  'QUESTS ATIVAS' as tipo,
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.status,
  q.started_at
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.status = 'active'
ORDER BY p.order_index, q.order_index;

-- 7. DESATIVAR TEMPORARIAMENTE OS JOBS (emergência)
-- DESCOMENTE APENAS SE NECESSÁRIO PARAR O LOOP
-- UPDATE cron.job SET active = false WHERE command LIKE '%auto_%';

-- SELECT 'JOBS DESATIVADOS - Sistema em modo manual' as aviso;
