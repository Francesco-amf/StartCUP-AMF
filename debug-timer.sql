-- ==========================================
-- DEBUG DO TIMER
-- ==========================================

SELECT
  '=== TODOS OS TIMESTAMPS ===' as info,
  current_phase,
  event_started,
  event_start_time,
  phase_1_start_time,
  phase_2_start_time,
  phase_3_start_time,
  phase_4_start_time,
  phase_5_start_time,
  NOW() as agora,
  -- Calcular diferenças em minutos
  EXTRACT(EPOCH FROM (NOW() - event_start_time))/60 as mins_desde_event_start,
  EXTRACT(EPOCH FROM (NOW() - phase_1_start_time))/60 as mins_desde_phase_1,
  EXTRACT(EPOCH FROM (NOW() - phase_2_start_time))/60 as mins_desde_phase_2,
  -- Ver qual timestamp o hook vai usar
  CASE
    WHEN current_phase = 1 THEN phase_1_start_time
    WHEN current_phase = 2 THEN phase_2_start_time
    WHEN current_phase = 3 THEN phase_3_start_time
    WHEN current_phase = 4 THEN phase_4_start_time
    WHEN current_phase = 5 THEN phase_5_start_time
    ELSE event_start_time
  END as timestamp_que_sera_usado,
  -- Calcular minutos desde o timestamp que será usado
  EXTRACT(EPOCH FROM (NOW() -
    CASE
      WHEN current_phase = 1 THEN phase_1_start_time
      WHEN current_phase = 2 THEN phase_2_start_time
      WHEN current_phase = 3 THEN phase_3_start_time
      WHEN current_phase = 4 THEN phase_4_start_time
      WHEN current_phase = 5 THEN phase_5_start_time
      ELSE event_start_time
    END
  ))/60 as mins_desde_timestamp_usado
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
