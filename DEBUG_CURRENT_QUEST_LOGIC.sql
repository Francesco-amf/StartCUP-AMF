-- 🔍 DEBUG: Verificar lógica de seleção de currentQuest

-- Ver TODAS quests da Fase 2 com detalhes de timing
SELECT 
  q.order_index,
  q.name,
  q.status,
  q.started_at,
  q.duration_minutes,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  CASE 
    WHEN q.started_at IS NOT NULL AND q.planned_deadline_minutes IS NOT NULL THEN
      q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')
    ELSE NULL
  END as "Prazo Normal",
  CASE 
    WHEN q.started_at IS NOT NULL AND q.planned_deadline_minutes IS NOT NULL THEN
      q.started_at + ((q.planned_deadline_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute')
    ELSE NULL
  END as "Prazo Final (com atraso)",
  CASE 
    WHEN q.started_at IS NOT NULL AND q.planned_deadline_minutes IS NOT NULL THEN
      NOW() > q.started_at + ((q.planned_deadline_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute')
    ELSE FALSE
  END as "Expirou?",
  NOW() as "Agora"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- ============================================================================
-- PROBLEMA IDENTIFICADO:
-- ============================================================================
-- A lógica do dashboard usa 'planned_deadline_minutes' para calcular expiração
-- MAS quando você ativa uma quest no ManualQuestControl, provavelmente:
-- - status = 'active' ✅
-- - started_at = NOW() ✅
-- - duration_minutes = 100 ✅
-- - planned_deadline_minutes = ??? (pode estar NULL ou diferente)
--
-- Se planned_deadline_minutes for NULL, a lógica do dashboard trata como "não expira"
-- Mas pode estar selecionando a quest errada
-- ============================================================================
