-- ==========================================
-- DESBLOQUEAR AGORA - Forçar countdown 60s
-- ==========================================

-- 1. Verificar estado atual
SELECT 
  current_phase,
  evaluation_period_end_time,
  event_end_time,
  all_submissions_evaluated,
  event_ended,
  (evaluation_period_end_time - NOW()) as tempo_passado_avaliacao,
  CASE 
    WHEN NOW() < evaluation_period_end_time THEN '⏳ PERÍODO DE AVALIAÇÃO'
    WHEN NOW() < event_end_time THEN '⏰ COUNTDOWN FINAL (60s)'
    WHEN event_ended THEN '🏁 EVENTO TERMINADO'
    ELSE '❓ ESTADO TRAVADO'
  END as status
FROM event_config;

-- 2. FORÇAR inicio do countdown final de 60 segundos
UPDATE event_config
SET 
  event_end_time = NOW() + INTERVAL '60 seconds',
  all_submissions_evaluated = true
WHERE 
  evaluation_period_end_time IS NOT NULL 
  AND NOW() > evaluation_period_end_time
  AND event_end_time IS NULL;

-- 3. Verificar se desbloqueou
SELECT 
  '🎯 COUNTDOWN FINAL INICIADO!' as status,
  event_end_time as termina_em,
  (event_end_time - NOW()) as segundos_restantes,
  all_submissions_evaluated
FROM event_config;
