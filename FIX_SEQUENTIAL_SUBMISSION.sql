-- ==================================================
-- 🔧 CORRIGIR VALIDAÇÃO SEQUENCIAL DE SUBMISSÕES
-- ==================================================
-- Problema: Sistema bloqueia submissão de quest atual
-- se quest anterior expirou sem submissão
-- 
-- Solução: Permitir submissão se quest anterior:
-- 1. Foi submetida OU
-- 2. Expirou totalmente (prazo + atraso)
-- ==================================================

CREATE OR REPLACE FUNCTION check_previous_quest_submitted(
  team_id_param UUID,
  quest_id_param UUID,
  OUT can_submit BOOLEAN,
  OUT reason TEXT
)
AS $$
DECLARE
  v_current_quest RECORD;
  v_previous_quest RECORD;
  v_previous_submission_count INTEGER;
  v_previous_quest_expired BOOLEAN;
BEGIN
  -- Buscar a quest atual e sua ordem
  SELECT
    id,
    phase_id,
    order_index
  INTO v_current_quest
  FROM quests
  WHERE id = quest_id_param;

  IF v_current_quest.id IS NULL THEN
    can_submit := FALSE;
    reason := 'Quest não encontrada';
    RETURN;
  END IF;

  -- Se é a primeira quest da fase, permitir
  IF v_current_quest.order_index = 1 THEN
    can_submit := TRUE;
    reason := 'Primeira quest da fase';
    RETURN;
  END IF;

  -- Encontrar a quest anterior na mesma fase
  SELECT 
    id,
    started_at,
    planned_deadline_minutes,
    late_submission_window_minutes
  INTO v_previous_quest
  FROM quests
  WHERE phase_id = v_current_quest.phase_id
    AND order_index = v_current_quest.order_index - 1
  LIMIT 1;

  IF v_previous_quest.id IS NULL THEN
    can_submit := TRUE;
    reason := 'Nenhuma quest anterior encontrada';
    RETURN;
  END IF;

  -- ========================================
  -- NOVA LÓGICA: Verificar se quest anterior expirou
  -- ========================================
  IF v_previous_quest.started_at IS NOT NULL 
     AND v_previous_quest.planned_deadline_minutes IS NOT NULL THEN
    
    -- Calcular se a quest anterior expirou totalmente
    v_previous_quest_expired := NOW() > (
      v_previous_quest.started_at + 
      (v_previous_quest.planned_deadline_minutes * INTERVAL '1 minute') + 
      (COALESCE(v_previous_quest.late_submission_window_minutes, 0) * INTERVAL '1 minute') +
      INTERVAL '500 milliseconds' -- epsilon para garantir
    );
    
    -- Se expirou, permitir avançar
    IF v_previous_quest_expired THEN
      can_submit := TRUE;
      reason := 'Quest anterior expirou - pode avançar';
      RETURN;
    END IF;
  END IF;

  -- ========================================
  -- LÓGICA ORIGINAL: Verificar se foi submetida
  -- ========================================
  SELECT COUNT(*) INTO v_previous_submission_count
  FROM submissions
  WHERE team_id = team_id_param
    AND quest_id = v_previous_quest.id;

  IF v_previous_submission_count > 0 THEN
    can_submit := TRUE;
    reason := 'Quest anterior já foi submetida';
  ELSE
    can_submit := FALSE;
    reason := 'Você deve primeiro enviar a quest anterior (ou aguarde ela expirar)';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- TESTE DA CORREÇÃO
-- ========================================
-- Execute este SELECT para testar a função:
/*
SELECT 
  q.order_index,
  q.name,
  q.started_at,
  q.planned_deadline_minutes,
  CASE 
    WHEN q.started_at IS NULL THEN 'NÃO INICIADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN 'EXPIRADA'
    ELSE 'ATIVA'
  END as status_quest,
  (SELECT can_submit FROM check_previous_quest_submitted(
    '00000000-0000-0000-0000-000000000001'::UUID, -- substitua pelo team_id real
    q.id
  )) as pode_submeter,
  (SELECT reason FROM check_previous_quest_submitted(
    '00000000-0000-0000-0000-000000000001'::UUID, -- substitua pelo team_id real
    q.id
  )) as motivo
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;
*/

-- ✅ Agora quests podem ser submetidas mesmo se a anterior expirou!
