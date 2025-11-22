-- 🔍 AUDITORIA COMPLETA: Verificar planned_deadline_minutes em TODAS as quests

-- Ver todas as quests de todas as fases
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.duration_minutes as "Duração",
  q.planned_deadline_minutes as "Deadline Planejado",
  q.late_submission_window_minutes as "Janela Atraso",
  CASE 
    WHEN q.duration_minutes = q.planned_deadline_minutes THEN '✅ OK'
    WHEN q.planned_deadline_minutes IS NULL THEN '⚠️ NULL'
    ELSE '❌ DIFERENTE'
  END as "Status Sincronia",
  q.started_at as "Iniciou Em"
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- ============================================================================
-- O QUE VERIFICAR:
-- ============================================================================
-- ✅ OK: duration_minutes = planned_deadline_minutes (sincronizado)
-- ⚠️ NULL: planned_deadline_minutes é NULL (dashboard trata como "não expira")
-- ❌ DIFERENTE: valores diferentes (pode causar problemas de expiração)
--
-- TODAS devem estar ✅ OK para funcionar corretamente!
-- ============================================================================
