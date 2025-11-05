-- ============================================================
-- FIX: Timer da Fase e Late Submission na Última Quest
-- ============================================================
-- Este script corrige dois problemas:
-- 1. Timer da fase zerando antes das quests terminarem
-- 2. Event_end_time não considera late submission da última quest
-- ============================================================

-- ============================================================
-- PARTE 1: Trigger para Ajustar event_end_time Automaticamente
-- ============================================================

-- Função que ajusta event_end_time quando a última quest da última fase inicia
CREATE OR REPLACE FUNCTION adjust_event_end_time_for_last_quest()
RETURNS TRIGGER AS $$
DECLARE
  v_phase_order INT;
  v_total_phases INT;
  v_is_last_quest BOOLEAN;
  v_new_event_end_time TIMESTAMP WITH TIME ZONE;
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
      
      -- Atualizar event_config
      UPDATE event_config
      SET event_end_time = v_new_event_end_time;
      
      RAISE NOTICE '✅ Event_end_time ajustado para última quest: %', v_new_event_end_time;
      RAISE NOTICE '   Quest: % (Fase %)', NEW.name, v_phase_order;
      RAISE NOTICE '   Prazo regular: % min', COALESCE(NEW.planned_deadline_minutes, NEW.duration_minutes);
      RAISE NOTICE '   Late window: % min', COALESCE(NEW.late_submission_window_minutes, 0);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger (remove se já existir)
DROP TRIGGER IF EXISTS adjust_event_end_time_trigger ON quests;

CREATE TRIGGER adjust_event_end_time_trigger
AFTER UPDATE ON quests
FOR EACH ROW
WHEN (NEW.started_at IS NOT NULL)
EXECUTE FUNCTION adjust_event_end_time_for_last_quest();

-- ============================================================
-- PARTE 2: Função Auxiliar para Calcular Fim Real da Fase
-- ============================================================

-- Função que retorna o timestamp REAL de término de uma fase
-- Considera late_submission_window da última quest
CREATE OR REPLACE FUNCTION get_actual_phase_end_time(p_phase_order INT)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_phase_id UUID;
  v_last_quest_record RECORD;
  v_phase_start_time TIMESTAMP WITH TIME ZONE;
  v_phase_duration_minutes INT;
  v_original_end_time TIMESTAMP WITH TIME ZONE;
  v_actual_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar ID da fase pelo order_index
  SELECT id, duration_minutes INTO v_phase_id, v_phase_duration_minutes
  FROM phases
  WHERE order_index = p_phase_order
  LIMIT 1;
  
  IF v_phase_id IS NULL THEN
    RAISE EXCEPTION 'Fase % não encontrada', p_phase_order;
  END IF;
  
  -- Buscar horário de início da fase do event_config
  IF p_phase_order = 1 THEN
    SELECT phase_1_start_time INTO v_phase_start_time FROM event_config LIMIT 1;
  ELSIF p_phase_order = 2 THEN
    SELECT phase_2_start_time INTO v_phase_start_time FROM event_config LIMIT 1;
  ELSIF p_phase_order = 3 THEN
    SELECT phase_3_start_time INTO v_phase_start_time FROM event_config LIMIT 1;
  ELSIF p_phase_order = 4 THEN
    SELECT phase_4_start_time INTO v_phase_start_time FROM event_config LIMIT 1;
  ELSIF p_phase_order = 5 THEN
    SELECT phase_5_start_time INTO v_phase_start_time FROM event_config LIMIT 1;
  ELSE
    v_phase_start_time := NULL;
  END IF;
  
  IF v_phase_start_time IS NULL THEN
    -- Fase não iniciou ainda
    RETURN NULL;
  END IF;
  
  -- Calcular fim ORIGINAL da fase (sem considerar late submission)
  v_original_end_time := v_phase_start_time + (v_phase_duration_minutes * INTERVAL '1 minute');
  
  -- Buscar última quest da fase que foi iniciada
  SELECT q.* INTO v_last_quest_record
  FROM quests q
  WHERE q.phase_id = v_phase_id
    AND q.started_at IS NOT NULL
  ORDER BY q.order_index DESC
  LIMIT 1;
  
  IF v_last_quest_record IS NULL THEN
    -- Nenhuma quest iniciada, usar fim original da fase
    RETURN v_original_end_time;
  END IF;
  
  -- Calcular fim REAL da última quest (com late submission)
  v_actual_end_time := v_last_quest_record.started_at + 
    (COALESCE(v_last_quest_record.planned_deadline_minutes, v_last_quest_record.duration_minutes, 60) * INTERVAL '1 minute') +
    (COALESCE(v_last_quest_record.late_submission_window_minutes, 0) * INTERVAL '1 minute');
  
  -- Retornar o MAIOR tempo (original da fase ou fim da última quest com late)
  RETURN GREATEST(v_original_end_time, v_actual_end_time);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PARTE 3: View com Informações de Timing das Fases
-- ============================================================

-- View que mostra timing detalhado de cada fase
CREATE OR REPLACE VIEW phase_timing_info AS
SELECT 
  p.order_index as fase,
  p.name as nome_fase,
  p.duration_minutes as duracao_planejada_min,
  
  -- Horário de início (do event_config)
  CASE p.order_index
    WHEN 1 THEN (SELECT phase_1_start_time FROM event_config LIMIT 1)
    WHEN 2 THEN (SELECT phase_2_start_time FROM event_config LIMIT 1)
    WHEN 3 THEN (SELECT phase_3_start_time FROM event_config LIMIT 1)
    WHEN 4 THEN (SELECT phase_4_start_time FROM event_config LIMIT 1)
    WHEN 5 THEN (SELECT phase_5_start_time FROM event_config LIMIT 1)
  END as inicio_planejado,
  
  -- Fim original (início + duração planejada)
  CASE p.order_index
    WHEN 1 THEN (SELECT phase_1_start_time FROM event_config LIMIT 1) + (p.duration_minutes * INTERVAL '1 minute')
    WHEN 2 THEN (SELECT phase_2_start_time FROM event_config LIMIT 1) + (p.duration_minutes * INTERVAL '1 minute')
    WHEN 3 THEN (SELECT phase_3_start_time FROM event_config LIMIT 1) + (p.duration_minutes * INTERVAL '1 minute')
    WHEN 4 THEN (SELECT phase_4_start_time FROM event_config LIMIT 1) + (p.duration_minutes * INTERVAL '1 minute')
    WHEN 5 THEN (SELECT phase_5_start_time FROM event_config LIMIT 1) + (p.duration_minutes * INTERVAL '1 minute')
  END as fim_planejado,
  
  -- Fim REAL (considerando late submission da última quest)
  get_actual_phase_end_time(p.order_index) as fim_real,
  
  -- Diferença (quanto a fase ultrapassou o planejado)
  EXTRACT(EPOCH FROM (
    get_actual_phase_end_time(p.order_index) - 
    CASE p.order_index
      WHEN 1 THEN (SELECT phase_1_start_time FROM event_config LIMIT 1) + (p.duration_minutes * INTERVAL '1 minute')
      WHEN 2 THEN (SELECT phase_2_start_time FROM event_config LIMIT 1) + (p.duration_minutes * INTERVAL '1 minute')
      WHEN 3 THEN (SELECT phase_3_start_time FROM event_config LIMIT 1) + (p.duration_minutes * INTERVAL '1 minute')
      WHEN 4 THEN (SELECT phase_4_start_time FROM event_config LIMIT 1) + (p.duration_minutes * INTERVAL '1 minute')
      WHEN 5 THEN (SELECT phase_5_start_time FROM event_config LIMIT 1) + (p.duration_minutes * INTERVAL '1 minute')
    END
  ))::INTEGER / 60 as minutos_extras,
  
  -- Última quest da fase
  (
    SELECT q.name 
    FROM quests q 
    WHERE q.phase_id = p.id 
    ORDER BY q.order_index DESC 
    LIMIT 1
  ) as ultima_quest,
  
  -- Late window da última quest
  (
    SELECT q.late_submission_window_minutes
    FROM quests q 
    WHERE q.phase_id = p.id 
    ORDER BY q.order_index DESC 
    LIMIT 1
  ) as late_window_ultima_quest

FROM phases p
ORDER BY p.order_index;

-- ============================================================
-- TESTE: Verificar Configuração Atual
-- ============================================================

/*
-- Ver timing de todas as fases
SELECT 
  fase,
  nome_fase,
  duracao_planejada_min,
  TO_CHAR(inicio_planejado, 'HH24:MI:SS') as inicio,
  TO_CHAR(fim_planejado, 'HH24:MI:SS') as fim_planejado,
  TO_CHAR(fim_real, 'HH24:MI:SS') as fim_real,
  COALESCE(minutos_extras, 0) as extras_min,
  ultima_quest,
  late_window_ultima_quest
FROM phase_timing_info;
*/

-- Ver event_end_time atual vs recomendado
/*
SELECT 
  'Atual' as tipo,
  event_end_time,
  TO_CHAR(event_end_time, 'HH24:MI:SS') as horario
FROM event_config

UNION ALL

SELECT 
  'Recomendado (Fase 5 + late)' as tipo,
  get_actual_phase_end_time(5) as event_end_time,
  TO_CHAR(get_actual_phase_end_time(5), 'HH24:MI:SS') as horario
FROM event_config;
*/

-- ============================================================
-- TESTE MANUAL: Simular Quest 5.3 e Verificar
-- ============================================================

/*
-- 1. Simular que Quest 5.3 acabou de começar
UPDATE quests
SET started_at = NOW()
WHERE order_index = 3
AND phase_id = (SELECT id FROM phases WHERE order_index = 5);

-- 2. Verificar se event_end_time foi ajustado automaticamente
SELECT 
  'Quest 5.3 iniciada em' as info,
  started_at,
  started_at + (planned_deadline_minutes * INTERVAL '1 minute') as fim_regular,
  started_at + (planned_deadline_minutes * INTERVAL '1 minute') + 
    (late_submission_window_minutes * INTERVAL '1 minute') as fim_com_late
FROM quests
WHERE order_index = 3
AND phase_id = (SELECT id FROM phases WHERE order_index = 5);

SELECT 
  'Event end time' as info,
  event_end_time,
  event_end_time - NOW() as tempo_restante
FROM event_config;

-- Esperado: event_end_time = fim_com_late da Query anterior
*/

-- ============================================================
-- ROLLBACK (se necessário)
-- ============================================================

/*
-- Remover trigger
DROP TRIGGER IF EXISTS adjust_event_end_time_trigger ON quests;
DROP FUNCTION IF EXISTS adjust_event_end_time_for_last_quest();

-- Remover função auxiliar
DROP FUNCTION IF EXISTS get_actual_phase_end_time(INT);

-- Remover view
DROP VIEW IF EXISTS phase_timing_info;
*/
