-- ==========================================
-- DESABILITAR RLS NO EVENT_CONFIG (TEMPORÁRIO)
-- ==========================================
-- Isso vai permitir leitura pública sem restrições

ALTER TABLE event_config DISABLE ROW LEVEL SECURITY;

-- Verificar status
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'event_config';

-- Testar acesso
SELECT
  '=== Teste após desabilitar RLS ===' as info,
  id,
  current_phase,
  event_started,
  event_start_time,
  phase_1_start_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
