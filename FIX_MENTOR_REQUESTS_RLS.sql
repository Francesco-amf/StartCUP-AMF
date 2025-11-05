-- ==========================================
-- FIX: Políticas RLS de mentor_requests
-- ==========================================
-- Problema: Políticas estavam buscando mentor na tabela 'teams'
-- Solução: Buscar na tabela 'evaluators'
-- ==========================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Mentors can view requests for them" ON mentor_requests;
DROP POLICY IF EXISTS "Mentors can update their requests" ON mentor_requests;

-- NOVA Política: Mentores podem ver solicitações direcionadas a eles
CREATE POLICY "Mentors can view requests for them" 
  ON mentor_requests FOR SELECT 
  TO authenticated 
  USING (
    -- Verifica se o mentor_id corresponde ao ID do avaliador logado
    mentor_id IN (
      SELECT id FROM evaluators WHERE email = auth.jwt()->>'email'
    )
    OR
    -- Admin pode ver tudo
    EXISTS (
      SELECT 1 FROM teams 
      WHERE email = auth.jwt()->>'email' 
      AND course = 'Administration'
    )
  );

-- NOVA Política: Mentores podem atualizar status de suas solicitações
CREATE POLICY "Mentors can update their requests" 
  ON mentor_requests FOR UPDATE 
  TO authenticated 
  USING (
    -- Verifica se o mentor_id corresponde ao ID do avaliador logado
    mentor_id IN (
      SELECT id FROM evaluators WHERE email = auth.jwt()->>'email'
    )
    OR
    -- Admin pode atualizar tudo
    EXISTS (
      SELECT 1 FROM teams 
      WHERE email = auth.jwt()->>'email' 
      AND course = 'Administration'
    )
  );

-- Verificar políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'mentor_requests'
ORDER BY policyname;
