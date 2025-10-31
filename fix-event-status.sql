-- ==========================================
-- CORRIGIR STATUS DO EVENTO
-- ==========================================

-- 1. Verificar status atual
SELECT
  'Status Atual:' as info,
  id,
  event_name,
  current_phase,
  event_started,
  event_ended,
  event_start_time,
  phase_1_start_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Iniciar o evento corretamente (Fase 1)
UPDATE event_config
SET
  current_phase = 1,
  event_started = true,
  event_ended = false,
  event_start_time = NOW(),
  phase_1_start_time = NOW(),
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. Verificar depois da atualização
SELECT
  'Status Após Atualização:' as info,
  id,
  event_name,
  current_phase,
  event_started,
  event_ended,
  event_start_time,
  phase_1_start_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
