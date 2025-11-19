-- ============================================================================
-- RESTORE: Restaurar deadlines originais da Fase 5
-- ============================================================================

-- Restaurar valores originais das quests da Fase 5
UPDATE quests
SET 
  planned_deadline_minutes = CASE order_index
    WHEN 1 THEN 20   -- Quest 5.1: 20 minutos
    WHEN 2 THEN 40   -- Quest 5.2: 40 minutos
    WHEN 3 THEN 30   -- Quest 5.3: 30 minutos
    ELSE planned_deadline_minutes
  END,
  duration_minutes = CASE order_index
    WHEN 1 THEN 20   -- Quest 5.1: 20 minutos
    WHEN 2 THEN 40   -- Quest 5.2: 40 minutos
    WHEN 3 THEN 30   -- Quest 5.3: 30 minutos
    ELSE duration_minutes
  END
WHERE phase_id = 5;

-- Verificar valores restaurados
SELECT 
  order_index,
  name,
  status,
  planned_deadline_minutes,
  duration_minutes,
  started_at,
  CASE 
    WHEN status = 'active' AND started_at IS NOT NULL 
    THEN started_at + (planned_deadline_minutes * INTERVAL '1 minute')
    ELSE NULL
  END as deadline_calculado
FROM quests
WHERE phase_id = 5
ORDER BY order_index;

SELECT '✅ Deadlines da Fase 5 restaurados aos valores originais' as status;
