-- ==========================================
-- DIAGNÓSTICO COMPLETO - Por que não desbloqueou?
-- ==========================================

-- 1. Estado completo do event_config
SELECT 
  id,
  current_phase,
  evaluation_period_end_time,
  event_end_time,
  all_submissions_evaluated,
  event_ended,
  created_at,
  updated_at,
  NOW() as agora,
  CASE 
    WHEN evaluation_period_end_time IS NULL THEN '✅ NULL (sem período)'
    WHEN NOW() < evaluation_period_end_time THEN '⏳ FUTURO (ainda não expirou)'
    WHEN NOW() > evaluation_period_end_time THEN '🔴 PASSADO (já expirou)'
    ELSE '❓ DESCONHECIDO'
  END as status_avaliacao,
  CASE 
    WHEN event_end_time IS NULL THEN '❌ NULL (countdown não iniciado)'
    WHEN NOW() < event_end_time THEN '⏰ FUTURO (countdown ativo)'
    WHEN NOW() > event_end_time THEN '🏁 PASSADO (evento terminou)'
    ELSE '❓ DESCONHECIDO'
  END as status_countdown
FROM event_config;

-- 2. Verificar quests ativas (deveria estar vazio após Fase 5)
SELECT 
  q.id,
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.status,
  q.started_at,
  q.deadline,
  CASE 
    WHEN q.deadline < NOW() THEN '🔴 EXPIRADA'
    ELSE '🟢 ATIVA'
  END as deadline_status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.status = 'active'
ORDER BY p.order_index, q.order_index;

-- 3. Contar submissions totais vs avaliadas
SELECT 
  COUNT(*) as total_submissions,
  COUNT(*) FILTER (WHERE points IS NOT NULL) as avaliadas,
  COUNT(*) FILTER (WHERE points IS NULL) as pendentes
FROM submissions;

-- 4. Verificar cron jobs
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  CASE WHEN active THEN '🔴 ATIVO' ELSE '🟢 DESATIVADO' END as status
FROM cron.job
WHERE jobname LIKE '%auto%'
ORDER BY jobid;

-- 5. FORÇAR UPDATE (mais agressivo)
UPDATE event_config
SET 
  event_end_time = NOW() + INTERVAL '60 seconds',
  all_submissions_evaluated = true,
  updated_at = NOW()
RETURNING 
  id,
  evaluation_period_end_time,
  event_end_time,
  all_submissions_evaluated,
  (event_end_time - NOW()) as segundos_restantes;
