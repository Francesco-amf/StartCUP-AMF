-- ==========================================
-- RESETAR HORÁRIO DO EVENTO PARA AGORA
-- ==========================================

-- Desabilitar RLS
ALTER TABLE event_config DISABLE ROW LEVEL SECURITY;

-- Atualizar timestamps para AGORA
UPDATE event_config
SET
  event_start_time = NOW(),
  phase_1_start_time = NOW(),
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Reabilitar RLS
ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

-- Verificar
SELECT
  '✅ Horário atualizado!' as status,
  event_start_time,
  phase_1_start_time,
  NOW() as hora_atual,
  EXTRACT(EPOCH FROM (NOW() - event_start_time))/60 as minutos_desde_inicio
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
