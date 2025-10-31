-- ==========================================
-- ADICIONAR POLÍTICAS RLS PARA DELETE
-- ==========================================
-- Permite que admins possam deletar registros

-- 1. Adicionar política DELETE para evaluations
DROP POLICY IF EXISTS "Admin pode deletar avaliações" ON evaluations;
CREATE POLICY "Admin pode deletar avaliações"
ON evaluations
FOR DELETE
TO authenticated
USING (
  -- Permite deletar se for admin
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
  OR
  -- Ou se for o avaliador que criou
  evaluator_id IN (
    SELECT id FROM evaluators WHERE email = auth.jwt()->>'email'
  )
);

-- 2. Adicionar política DELETE para submissions
DROP POLICY IF EXISTS "Admin pode deletar submissions" ON submissions;
CREATE POLICY "Admin pode deletar submissions"
ON submissions
FOR DELETE
TO authenticated
USING (
  -- Permite deletar se for admin
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- 3. Verificar políticas existentes
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('evaluations', 'submissions')
ORDER BY tablename, cmd, policyname;
