-- ==========================================
-- PERMITIR ACESSO PÚBLICO AO EVENT_CONFIG
-- ==========================================
-- A live dashboard precisa ler event_config sem autenticação

-- Dropar política antiga
DROP POLICY IF EXISTS "Todos podem ver config do evento" ON event_config;

-- Criar política que permite leitura para todos (incluindo anon)
CREATE POLICY "Todos podem ver config do evento"
ON event_config
FOR SELECT
USING (true);  -- Remove TO authenticated, permitindo anon também

-- Verificar políticas
SELECT
  '=== Políticas de event_config ===' as info,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'event_config'
ORDER BY cmd, policyname;

-- Testar acesso sem autenticação
SELECT
  '=== Teste de acesso ===' as info,
  id,
  current_phase,
  event_started,
  phase_1_start_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
