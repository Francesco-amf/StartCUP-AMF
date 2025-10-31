-- ==========================================
-- FORÇAR INÍCIO DO EVENTO (TEMPORÁRIO)
-- ==========================================
-- Use este script para forçar o início enquanto testamos

-- Desabilitar RLS temporariamente
ALTER TABLE event_config DISABLE ROW LEVEL SECURITY;

-- Forçar início da Fase 1
UPDATE event_config
SET
  current_phase = 1,
  event_started = true,
  event_ended = false,
  event_start_time = NOW(),
  phase_1_start_time = NOW(),
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Reabilitar RLS
ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

-- Verificar resultado
SELECT
  '✅ Evento iniciado com sucesso!' as status,
  event_name,
  current_phase,
  event_started,
  event_ended,
  event_start_time,
  phase_1_start_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
