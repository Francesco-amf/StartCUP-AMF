-- ============================================================================
-- FIX: Add WHERE clause to adjust_event_end_time_for_last_quest trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.adjust_event_end_time_for_last_quest()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_phase_order INT;
  v_total_phases INT;
  v_is_last_quest BOOLEAN;
  v_new_event_end_time TIMESTAMP WITH TIME ZONE;
  v_event_id UUID;
BEGIN
  -- Verificar se a quest foi iniciada (started_at mudou de NULL para NOT NULL)
  IF NEW.started_at IS NOT NULL AND (OLD.started_at IS NULL OR OLD.started_at IS DISTINCT FROM NEW.started_at) THEN
    
    -- Buscar order_index da fase desta quest
    SELECT p.order_index INTO v_phase_order
    FROM phases p
    WHERE p.id = NEW.phase_id;
    
    -- Buscar total de fases no evento
    SELECT MAX(order_index) INTO v_total_phases
    FROM phases;
    
    -- Verificar se esta quest é a última da última fase
    -- Assumindo que cada fase tem 3 quests (order_index 1, 2, 3)
    v_is_last_quest := (v_phase_order = v_total_phases) AND (NEW.order_index = 3);
    
    IF v_is_last_quest THEN
      -- Calcular novo event_end_time
      -- = started_at da última quest + planned_deadline + late_submission_window
      v_new_event_end_time := NEW.started_at + 
        (COALESCE(NEW.planned_deadline_minutes, NEW.duration_minutes, 60) * INTERVAL '1 minute') +
        (COALESCE(NEW.late_submission_window_minutes, 0) * INTERVAL '1 minute');
      
      -- 🔧 FIX: Get event_id primeiro (assumindo que existe apenas 1 evento)
      SELECT id INTO v_event_id FROM event_config LIMIT 1;
      
      -- 🔧 FIX: Atualizar event_config COM WHERE CLAUSE
      UPDATE event_config
      SET event_end_time = v_new_event_end_time
      WHERE id = v_event_id;  -- ✅ ADICIONADO WHERE CLAUSE
      
      RAISE NOTICE '✅ Event_end_time ajustado para última quest: %', v_new_event_end_time;
      RAISE NOTICE '   Quest: % (Fase %)', NEW.name, v_phase_order;
      RAISE NOTICE '   Prazo regular: % min', COALESCE(NEW.planned_deadline_minutes, NEW.duration_minutes);
      RAISE NOTICE '   Late window: % min', COALESCE(NEW.late_submission_window_minutes, 0);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

SELECT '✅ Trigger function fixed - WHERE clause added to UPDATE event_config' as status;
