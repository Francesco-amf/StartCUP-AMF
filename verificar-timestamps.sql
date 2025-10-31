-- ==========================================
-- VERIFICAR TIMESTAMPS ATUAIS
-- ==========================================

SELECT
  '=== TIMESTAMPS ATUAIS ===' as info,
  id,
  current_phase,
  event_started,
  event_start_time,
  phase_1_start_time,
  phase_2_start_time,
  NOW() as hora_atual,
  EXTRACT(EPOCH FROM (NOW() - event_start_time))/60 as minutos_desde_event_start,
  EXTRACT(EPOCH FROM (NOW() - phase_1_start_time))/60 as minutos_desde_phase_1_start
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Ver diferença de fuso horário
SELECT
  '=== INFORMAÇÕES DE TIMEZONE ===' as info,
  NOW() as now_servidor,
  CURRENT_TIMESTAMP as current_timestamp,
  event_start_time,
  event_start_time AT TIME ZONE 'UTC' as event_start_utc,
  NOW() - event_start_time as diferenca
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
