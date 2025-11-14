-- ==========================================
-- VERIFICAR: TODAS AS QUESTS CORRIGIDAS
-- ==========================================

SELECT
  id,
  name,
  phase_id,
  order_index,
  deliverable_type,
  CASE
    WHEN deliverable_type LIKE '%["file"%' OR deliverable_type LIKE '%["url"%' THEN '✅ CORRETO (FILE/URL)'
    WHEN deliverable_type LIKE '%presentation%' THEN '✅ CORRETO (BOSS)'
    ELSE '❌ PROBLEMA: ' || deliverable_type
  END as status
FROM quests
ORDER BY phase_id, order_index;
