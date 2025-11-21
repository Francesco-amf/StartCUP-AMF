-- Verificar fluxo de auto-activation para TODAS as phases
-- Execute no Supabase SQL Editor

WITH phase_data AS (
  SELECT 
    p.order_index as phase_num,
    COUNT(q.id) as total_quests,
    MAX(CASE WHEN q.order_index = 4 THEN 1 ELSE 0 END) as has_boss
  FROM phases p
  LEFT JOIN quests q ON q.phase_id = p.id
  GROUP BY p.order_index
)
SELECT 
  'PHASE ' || phase_num::text as section,
  'Total quests' as item,
  total_quests::text as info,
  CASE WHEN has_boss = 1 THEN '🔴 TEM BOSS' ELSE '✅ Sem boss' END as boss_status
FROM phase_data
WHERE phase_num BETWEEN 1 AND 5
ORDER BY phase_num;
