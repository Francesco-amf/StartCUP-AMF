-- ============================================================================
-- CORREÇÃO DEFINITIVA: phase_1_start_time com valor correto (12:56:42 BRT)
-- ============================================================================
-- Este SQL DEVE ser executado no Supabase SQL Editor
-- ============================================================================

UPDATE event_config
SET phase_1_start_time = '2025-11-21 12:56:42.626'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verificar resultado
SELECT 
  'event_start_time' as campo,
  event_start_time as valor
FROM event_config
UNION ALL
SELECT 
  'phase_1_start_time',
  phase_1_start_time
FROM event_config
UNION ALL
SELECT
  'Quest 1.1 started_at',
  started_at
FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 1;
