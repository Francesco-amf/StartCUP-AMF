-- ==================================================
-- DEBUG: Verificar por que auto_advance_phase() está avançando rápido demais
-- ==================================================

-- 1. Ver configuração atual do evento
SELECT 
  current_phase,
  event_started,
  updated_at,
  created_at
FROM event_config;

-- 2. Ver TODAS as quests de TODAS as fases
SELECT 
  p.order_index as fase,
  q.order_index as quest_ordem,
  q.name as quest_name,
  q.started_at,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  CASE 
    WHEN q.started_at IS NULL THEN 'NÃO INICIADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN 'EXPIRADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN 'ATRASO'
    ELSE 'NO PRAZO'
  END as status,
  (SELECT COUNT(*) FROM submissions s WHERE s.quest_id = q.id) as submissoes
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- 3. Simular exatamente o que auto_advance_phase() faz para CADA fase
DO $$
DECLARE
  v_phase INT;
  v_total_quests INT;
  v_expired_quests INT;
  v_submitted_quests INT;
  v_all_expired BOOLEAN;
BEGIN
  FOR v_phase IN 1..5 LOOP
    -- Contar total
    SELECT COUNT(*) INTO v_total_quests
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_phase;

    -- Contar expiradas
    SELECT COUNT(*) INTO v_expired_quests
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_phase
      AND q.started_at IS NOT NULL
      AND q.planned_deadline_minutes IS NOT NULL
      AND NOW() > (
        q.started_at + 
        (q.planned_deadline_minutes * INTERVAL '1 minute') + 
        (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')
      );

    -- Contar submetidas
    SELECT COUNT(DISTINCT q.id) INTO v_submitted_quests
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_phase
      AND EXISTS (SELECT 1 FROM submissions s WHERE s.quest_id = q.id);

    -- Verificar condição
    v_all_expired := (v_expired_quests >= v_total_quests) OR 
                     ((v_expired_quests + v_submitted_quests) >= v_total_quests);

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fase %:', v_phase;
    RAISE NOTICE '  Total quests: %', v_total_quests;
    RAISE NOTICE '  Expiradas: %', v_expired_quests;
    RAISE NOTICE '  Submetidas: %', v_submitted_quests;
    RAISE NOTICE '  (exp + sub) >= total: % >= %', (v_expired_quests + v_submitted_quests), v_total_quests;
    RAISE NOTICE '  Avançaria?: %', v_all_expired;
  END LOOP;
END $$;

-- 4. Ver histórico de execuções do cron (se disponível)
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'auto-advance-phase-job';

-- 5. Ver logs recentes (se disponível - nem sempre funciona)
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-advance-phase-job')
-- ORDER BY start_time DESC
-- LIMIT 10;
