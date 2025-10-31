-- ==========================================
-- CORRIGIR FLAG event_started
-- ==========================================

-- Ver estado atual
SELECT
  '=== ANTES DA CORREÇÃO ===' as etapa,
  id,
  current_phase,
  event_started,
  event_ended,
  event_start_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Desabilitar RLS
ALTER TABLE event_config DISABLE ROW LEVEL SECURITY;

-- Corrigir: se current_phase >= 1, então event_started deve ser true
UPDATE event_config
SET
  event_started = true,
  event_start_time = COALESCE(event_start_time, NOW()),
  phase_1_start_time = COALESCE(phase_1_start_time, NOW()),
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND current_phase >= 1;

-- Reabilitar RLS
ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

-- Ver resultado
SELECT
  '=== DEPOIS DA CORREÇÃO ===' as etapa,
  id,
  current_phase,
  event_started,
  event_ended,
  event_start_time,
  phase_1_start_time,
  CASE
    WHEN event_started = true AND event_ended = false THEN '✅ 🔥 Evento em Andamento'
    WHEN event_started = false THEN '❌ ⏸️ Aguardando Início'
    WHEN event_ended = true THEN '🏁 Evento Encerrado'
  END as status_display
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
