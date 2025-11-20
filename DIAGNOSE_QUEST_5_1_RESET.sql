-- ==========================================
-- DIAGNÓSTICO URGENTE: Por que voltou para Quest 5.1?
-- ==========================================

-- 1. Verificar jobs ativos
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active,
  CASE WHEN active THEN '🔴 ATIVO' ELSE '🟢 DESATIVADO' END as status
FROM cron.job
WHERE jobname LIKE '%auto%'
ORDER BY jobid;

-- 2. Verificar estado do event_config
SELECT 
  current_phase,
  evaluation_period_end_time,
  event_end_time,
  all_submissions_evaluated,
  event_ended,
  (evaluation_period_end_time - NOW()) as tempo_restante_avaliacao,
  (event_end_time - NOW()) as tempo_restante_evento,
  CASE 
    WHEN NOW() < evaluation_period_end_time THEN '⏳ PERÍODO DE AVALIAÇÃO'
    WHEN NOW() < event_end_time THEN '⏰ COUNTDOWN FINAL (60s)'
    WHEN event_ended THEN '🏁 EVENTO TERMINADO'
    ELSE '❓ ESTADO DESCONHECIDO'
  END as status_atual
FROM event_config;

-- 3. Verificar quests ativas
SELECT 
  q.id,
  p.order_index as fase,
  q.order_index as quest_num,
  q.name,
  q.status,
  q.started_at,
  CASE 
    WHEN q.status = 'active' THEN '🟢 ATIVA'
    WHEN q.status = 'closed' THEN '🔴 FECHADA'
    ELSE q.status
  END as status_visual
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.status = 'active'
ORDER BY p.order_index, q.order_index;

-- 4. Verificar última execução de auto_advance_phase
-- (Pode mostrar RAISE NOTICE nos logs do Supabase)

-- ==========================================
-- DIAGNÓSTICO ESPERADO:
-- ==========================================
-- Se jobs 3 e 8 estão ATIVOS:
--   → Eles estão chamando auto_advance_phase() a cada minuto
--   → Função detecta "evaluation_period_end_time JÁ EXISTE"
--   → Deveria dar RETURN sem fazer nada
--   
-- Se evaluation_period_end_time foi RESETADO:
--   → Algo limpou o campo (bug ou script manual)
--   → auto_advance_phase() detecta "Fase 5 completa, não há Fase 6"
--   → Re-seta evaluation_period_end_time = NOW() + 20min
--   → LOOP recomeça
--
-- Se Quest 5.1 está ATIVA:
--   → auto_advance_phase() RESETOU a fase para 5
--   → Isso NÃO DEVERIA acontecer se evaluation_period_end_time existe
-- ==========================================
