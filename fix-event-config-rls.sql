-- ==========================================
-- CORRIGIR RLS DO EVENT_CONFIG
-- ==========================================

-- 1. Verificar políticas atuais
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'event_config'
ORDER BY cmd, policyname;

-- 2. Dropar políticas antigas (se existirem)
DROP POLICY IF EXISTS "Todos podem ver config do evento" ON event_config;
DROP POLICY IF EXISTS "Apenas admin pode atualizar config" ON event_config;

-- 3. Criar políticas corretas
CREATE POLICY "Todos podem ver config do evento"
ON event_config
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin pode atualizar config"
ON event_config
FOR UPDATE
TO authenticated
USING (
  -- Permite atualizar se for admin
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  -- Permite atualizar se for admin
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- 4. Verificar políticas depois
SELECT
  'Políticas após correção:' as info,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'event_config'
ORDER BY cmd, policyname;
