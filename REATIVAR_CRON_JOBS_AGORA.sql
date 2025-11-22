-- ⚡ REATIVAR CRON JOBS - Sistema vai se ajustar automaticamente

-- 1️⃣ VERIFICAR ESTADO ATUAL DOS CRON JOBS
SELECT 
  jobname as "Job",
  schedule as "Quando Roda",
  active as "Ativo?",
  jobid as "ID"
FROM cron.job 
WHERE jobname IN ('auto-start-next-quest-job', 'auto-advance-phase-job')
ORDER BY jobname;

-- 2️⃣ REATIVAR CRON JOBS (se estiverem desativados)
-- Job: auto_start_next_quest (ativa próxima quest quando atual expira)
SELECT cron.schedule(
  'auto-start-next-quest-job',
  '* * * * *',  -- A cada minuto
  'SELECT auto_start_next_quest();'
);

-- Job: auto_advance_phase (avança para próxima fase quando todas quests terminam)
SELECT cron.schedule(
  'auto-advance-phase-job',
  '* * * * *',  -- A cada minuto
  'SELECT auto_advance_phase();'
);

-- 3️⃣ CONFIRMAR QUE ESTÃO ATIVOS
SELECT 
  jobname as "Job",
  active as "Ativo?",
  CASE 
    WHEN active THEN '✅ RODANDO'
    ELSE '❌ PARADO'
  END as "Status"
FROM cron.job 
WHERE jobname IN ('auto-start-next-quest-job', 'auto-advance-phase-job');

-- ============================================================================
-- O QUE VAI ACONTECER AGORA:
-- ============================================================================
-- 1. Cron roda a cada minuto
-- 2. Verifica se Quest 2.2 atual expirou (based em started_at + duration)
-- 3. Se expirou: ativa Quest 2.3 automaticamente
-- 4. Quest 2.3 expira: ativa BOSS 2.4 automaticamente
-- 5. BOSS 2.4 expira: avança para Fase 3
--
-- TUDO VAI SE AJUSTAR SOZINHO baseado no started_at de cada quest!
-- ============================================================================

-- 4️⃣ VER QUANDO A QUEST ATUAL (2.2) VAI EXPIRAR
SELECT 
  q.name as "Quest Atual",
  q.started_at as "Iniciou",
  q.started_at + (q.duration_minutes * INTERVAL '1 minute') as "Expira Normal",
  q.started_at + ((q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute') as "Expira com Janela",
  NOW() as "Agora",
  CASE 
    WHEN NOW() >= q.started_at + ((q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute')
    THEN '❌ JÁ EXPIROU - Próxima vai ativar em 1 min'
    ELSE '⏰ Faltam ' || 
         ROUND(EXTRACT(EPOCH FROM (
           q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW()
         )) / 60) || ' min'
  END as "Status"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 AND q.order_index = 2;
