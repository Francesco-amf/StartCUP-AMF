-- ==========================================
-- VERIFICAR ESTADO ATUAL DO EVENTO
-- ==========================================

SELECT 
  id,
  current_phase,
  event_started,
  event_ended,
  evaluation_period_end_time,
  event_end_time,
  all_submissions_evaluated,
  CASE 
    WHEN NOT event_started THEN '⏸️ NÃO INICIADO'
    WHEN event_ended THEN '🏁 TERMINADO'
    WHEN evaluation_period_end_time IS NOT NULL AND NOW() < evaluation_period_end_time THEN '⏰ PERÍODO AVALIAÇÃO'
    WHEN event_end_time IS NOT NULL AND NOW() < event_end_time THEN '⏰ COUNTDOWN FINAL (60s)'
    ELSE '🎮 EM ANDAMENTO'
  END as status_atual
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Se mostrar evento terminado mas current_phase = 0, é cache do frontend
-- Solução: Hard refresh (Ctrl+Shift+R) no navegador
