-- 🔧 SOLUÇÃO: REDUZIR QUEST 2.3 PARA 100 MINUTOS

-- Situação:
-- - Timer da fase: 1h56min (116 min)
-- - Quest 2.2: 6 min restantes
-- - Quest 2.3: 120 min (MUITO!)
-- - BOSS 2.4: 10 min
-- - PROBLEMA: 6 + 120 + 10 = 136 min > 116 min (faltam 20 min)
--
-- SOLUÇÃO: Quest 2.3 = 100 min
-- - Quest 2.2: 6 min
-- - Quest 2.3: 100 min
-- - BOSS 2.4: 10 min
-- - TOTAL: 116 min ✅ PERFEITO!

UPDATE quests
SET duration_minutes = 100
WHERE id IN (
  SELECT q.id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 2 
    AND q.order_index = 3
)
RETURNING 
  order_index as "Quest",
  name as "Nome",
  duration_minutes as "Nova Duração (min)",
  status as "Status";

-- ✅ Quest 2.3 agora tem 100 minutos
-- ✅ Total da fase: 6 + 100 + 10 = 116 min = 1h56min
-- ✅ Timer da fase e quests vão terminar JUNTOS!
