-- ========================================
-- PERMITIR SUBMISSÕES MESMO COM QUEST PAUSADA
-- ========================================
-- Data: 2025-11-22
-- Objetivo: Modificar validate_submission_allowed() para aceitar status 'paused'
-- Comportamento: Pause apenas congela o cronômetro, mas permite submissões

-- ========================================
-- ATUALIZAR FUNÇÃO validate_submission_allowed
-- ========================================
-- Primeiro remover a função existente
DROP FUNCTION IF EXISTS validate_submission_allowed(UUID, UUID);

CREATE OR REPLACE FUNCTION validate_submission_allowed(
  team_id_param UUID,
  quest_id_param UUID,
  OUT is_allowed BOOLEAN,
  OUT reason TEXT,
  OUT late_minutes_calculated INTEGER,
  OUT penalty_calculated INTEGER,
  OUT debug_now TIMESTAMP,
  OUT debug_deadline TIMESTAMP,
  OUT debug_late_window_end TIMESTAMP,
  OUT debug_v_minutes_late INTEGER,
  OUT debug_v_penalty INTEGER
)
AS $$
DECLARE
  v_quest RECORD;
  v_deadline TIMESTAMP;
  v_now TIMESTAMP;
  v_late_window_end TIMESTAMP;
  v_minutes_late INTEGER;
  v_penalty INTEGER;
  v_seconds_late INTEGER;
BEGIN
  v_now := NOW() AT TIME ZONE 'UTC';
  debug_now := v_now;

  -- Buscar dados da quest
  SELECT
    id,
    status,
    started_at,
    ended_at,
    planned_deadline_minutes,
    late_submission_window_minutes,
    allow_late_submissions
  INTO v_quest
  FROM quests
  WHERE id = quest_id_param;

  -- Validação 1: Quest existe?
  IF v_quest.id IS NULL THEN
    is_allowed := FALSE;
    reason := 'Quest não encontrada';
    RETURN;
  END IF;

  -- ✅ MODIFICAÇÃO: Aceitar 'active', 'paused' ou 'closed'
  -- Pausar apenas congela o cronômetro, não bloqueia submissões
  IF v_quest.status NOT IN ('active', 'paused', 'closed') THEN
    is_allowed := FALSE;
    reason := 'Quest não está disponível para submissão';
    RETURN;
  END IF;

  -- Validação 3: Quest foi iniciada?
  IF v_quest.started_at IS NULL THEN
    is_allowed := FALSE;
    reason := 'Quest ainda não começou';
    RETURN;
  END IF;

  -- Calcular deadline
  v_deadline := v_quest.started_at + (v_quest.planned_deadline_minutes || ' minutes')::interval;
  v_late_window_end := v_deadline + (v_quest.late_submission_window_minutes || ' minutes')::interval;

  -- Validação 4: Não passou da janela de atraso?
  IF v_now > v_late_window_end THEN
    is_allowed := FALSE;
    reason := 'Prazo para submissão expirou completamente';
    RETURN;
  END IF;

  -- Calcular minutos de atraso
  IF v_now > v_deadline THEN
    -- ✅ Calcular em SEGUNDOS, não minutos
    v_seconds_late := EXTRACT(EPOCH FROM (v_now - v_deadline))::INTEGER;
    v_minutes_late := CEIL(v_seconds_late::DECIMAL / 60)::INTEGER;
    -- Passar SEGUNDOS para a função (ela converte internamente)
    v_penalty := calculate_late_penalty(v_seconds_late);

    -- Se a penalidade é NULL, significa que passou de 15 minutos
    IF v_penalty IS NULL THEN
      is_allowed := FALSE;
      reason := 'Prazo para submissão expirou';
      RETURN;
    END IF;

    is_allowed := TRUE;
    reason := 'Submissão atrasada, será aplicada penalidade';
    late_minutes_calculated := v_minutes_late;
    penalty_calculated := v_penalty;
  ELSE
    is_allowed := TRUE;
    reason := 'No prazo';
    late_minutes_calculated := 0;
    penalty_calculated := 0;
  END IF;

  debug_deadline := v_deadline;
  debug_late_window_end := v_late_window_end;
  debug_v_minutes_late := v_minutes_late;
  debug_v_penalty := v_penalty;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VALIDAÇÃO: Testar a função atualizada
-- ========================================
SELECT '=== TESTE: Validar submissão com quest pausada ===' as teste;

-- Buscar uma quest ativa atual para testar
DO $$
DECLARE
  v_team_id UUID;
  v_quest_id UUID;
  v_result RECORD;
BEGIN
  -- Pegar primeira equipe
  SELECT id INTO v_team_id FROM teams LIMIT 1;
  
  -- Pegar quest atual ativa
  SELECT id INTO v_quest_id 
  FROM quests 
  WHERE status = 'active' 
  ORDER BY started_at DESC 
  LIMIT 1;
  
  IF v_quest_id IS NULL THEN
    RAISE NOTICE '❌ Nenhuma quest ativa encontrada para testar';
    RETURN;
  END IF;
  
  -- Testar validação COM quest ativa
  SELECT * INTO v_result 
  FROM validate_submission_allowed(v_team_id, v_quest_id);
  
  RAISE NOTICE '✅ Quest ATIVA - is_allowed: %, reason: %', 
    v_result.is_allowed, 
    v_result.reason;
  
  -- Simular pausa temporária para testar
  UPDATE quests SET status = 'paused' WHERE id = v_quest_id;
  
  -- Testar validação COM quest pausada
  SELECT * INTO v_result 
  FROM validate_submission_allowed(v_team_id, v_quest_id);
  
  RAISE NOTICE '✅ Quest PAUSADA - is_allowed: %, reason: %', 
    v_result.is_allowed, 
    v_result.reason;
  
  -- Restaurar status original
  UPDATE quests SET status = 'active' WHERE id = v_quest_id;
  
  RAISE NOTICE '✅ Status restaurado para active';
END $$;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- ✅ Quest ATIVA - is_allowed: true, reason: No prazo
-- ✅ Quest PAUSADA - is_allowed: true, reason: No prazo
-- ✅ Status restaurado para active

SELECT '=== CONCLUSÃO ===' as conclusao;
SELECT 'Agora as equipes podem enviar submissões mesmo com quest pausada' as comportamento;
SELECT 'Pausar apenas congela o cronômetro visual, não bloqueia envios' as nota;
