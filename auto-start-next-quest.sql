-- ==================================================
-- SISTEMA AUTOMÁTICO DE QUESTS
-- ==================================================
-- Inicia automaticamente a próxima quest quando a atual termina
-- (seja por submissão ou expiração)
-- ==================================================

-- PASSO 1: Criar função que inicia próxima quest automaticamente
CREATE OR REPLACE FUNCTION auto_start_next_quest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_phase INT;
  v_current_quest_order INT;
  v_next_quest_order INT;
  v_total_quests INT;
  v_quest_to_start_id UUID;
BEGIN
  -- Buscar fase atual
  SELECT current_phase INTO v_current_phase
  FROM event_config
  LIMIT 1;

  IF v_current_phase IS NULL THEN
    RAISE NOTICE 'Nenhuma fase configurada';
    RETURN;
  END IF;

  RAISE NOTICE '🔍 Verificando quests da Fase %', v_current_phase;

  -- Contar total de quests da fase atual
  SELECT COUNT(*) INTO v_total_quests
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase;

  -- Encontrar a quest de maior order_index que já está ativa ou finalizada
  -- (última quest que foi iniciada)
  SELECT MAX(q.order_index) INTO v_current_quest_order
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.started_at IS NOT NULL;

  IF v_current_quest_order IS NULL THEN
    RAISE NOTICE '⚠️ Nenhuma quest iniciada na Fase %', v_current_phase;
    RETURN;
  END IF;

  RAISE NOTICE '📍 Última quest iniciada: Quest %', v_current_quest_order;

  -- Verificar se a quest atual já terminou (expirou OU foi submetida)
  DECLARE
    v_current_quest_finished BOOLEAN := FALSE;
    v_current_quest_id UUID;
    v_current_quest_expired BOOLEAN;
    v_current_quest_submitted BOOLEAN;
  BEGIN
    -- Buscar ID da quest atual
    SELECT q.id INTO v_current_quest_id
    FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = v_current_phase
      AND q.order_index = v_current_quest_order;

    -- Verificar se expirou
    SELECT EXISTS(
      SELECT 1 FROM quests q
      WHERE q.id = v_current_quest_id
        AND q.started_at IS NOT NULL
        AND q.planned_deadline_minutes IS NOT NULL
        AND NOW() > (
          q.started_at + 
          (q.planned_deadline_minutes * INTERVAL '1 minute') + 
          (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')
        )
    ) INTO v_current_quest_expired;

    -- Verificar se foi submetida
    SELECT EXISTS(
      SELECT 1 FROM submissions WHERE quest_id = v_current_quest_id
    ) INTO v_current_quest_submitted;

    v_current_quest_finished := v_current_quest_expired OR v_current_quest_submitted;

    RAISE NOTICE '  Expirou?: % | Submetida?: % | Finalizada?: %', 
                 v_current_quest_expired, v_current_quest_submitted, v_current_quest_finished;

    -- Se não terminou, não fazer nada
    IF NOT v_current_quest_finished THEN
      RAISE NOTICE '⏳ Quest % ainda em andamento. Aguardando.', v_current_quest_order;
      RETURN;
    END IF;
  END;

  -- Quest atual terminou, iniciar a próxima
  v_next_quest_order := v_current_quest_order + 1;

  -- Verificar se existe próxima quest na fase
  IF v_next_quest_order > v_total_quests THEN
    RAISE NOTICE '🏁 Quest % era a última da Fase %. Todas as quests finalizadas.', 
                 v_current_quest_order, v_current_phase;
    RETURN;
  END IF;

  -- Buscar ID da próxima quest
  SELECT q.id INTO v_quest_to_start_id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.order_index = v_next_quest_order;

  -- Verificar se já foi iniciada
  IF EXISTS (SELECT 1 FROM quests WHERE id = v_quest_to_start_id AND started_at IS NOT NULL) THEN
    RAISE NOTICE '⚠️ Quest % já foi iniciada anteriormente', v_next_quest_order;
    RETURN;
  END IF;

  -- Iniciar próxima quest
  UPDATE quests
  SET started_at = NOW(),
      status = 'active'
  WHERE id = v_quest_to_start_id;

  RAISE NOTICE '✅ Quest % da Fase % iniciada automaticamente!', v_next_quest_order, v_current_phase;

END;
$$;

-- ==================================================
-- PASSO 2: Agendar execução automática a cada minuto
-- ==================================================

SELECT cron.schedule(
  'auto-start-next-quest-job',
  '* * * * *',
  $$ SELECT auto_start_next_quest(); $$
);

-- ==================================================
-- VERIFICAÇÃO
-- ==================================================

-- Ver jobs agendados:
SELECT 
  jobname, 
  schedule, 
  active,
  command
FROM cron.job 
WHERE jobname IN ('auto-advance-phase-job', 'auto-start-next-quest-job')
ORDER BY jobname;

-- Testar manualmente (opcional):
SELECT auto_start_next_quest();

-- Ver estado das quests:
SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.status,
  q.started_at,
  CASE 
    WHEN q.started_at IS NULL THEN 'NÃO INICIADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN 'EXPIRADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN 'ATRASADA'
    ELSE 'ATIVA'
  END as situacao
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = (SELECT current_phase FROM event_config LIMIT 1)
ORDER BY q.order_index;
