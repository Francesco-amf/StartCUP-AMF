-- Verificar políticas RLS atuais na tabela evaluations
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'evaluations';

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Avaliadores podem ver suas avaliações" ON evaluations;
DROP POLICY IF EXISTS "Avaliadores podem inserir avaliações" ON evaluations;
DROP POLICY IF EXISTS "Avaliadores podem atualizar suas avaliações" ON evaluations;
DROP POLICY IF EXISTS "Todos podem ver avaliações" ON evaluations;

-- Garantir que RLS está habilitado
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (qualquer um autenticado pode ver)
CREATE POLICY "Todos podem ver avaliações"
ON evaluations
FOR SELECT
TO authenticated
USING (true);

-- Política para INSERT (avaliadores podem inserir suas próprias avaliações)
CREATE POLICY "Avaliadores podem inserir avaliações"
ON evaluations
FOR INSERT
TO authenticated
WITH CHECK (
  evaluator_id IN (
    SELECT id FROM evaluators WHERE email = auth.jwt()->>'email'
  )
);

-- Política para UPDATE (avaliadores podem atualizar suas próprias avaliações)
CREATE POLICY "Avaliadores podem atualizar suas avaliações"
ON evaluations
FOR UPDATE
TO authenticated
USING (
  evaluator_id IN (
    SELECT id FROM evaluators WHERE email = auth.jwt()->>'email'
  )
)
WITH CHECK (
  evaluator_id IN (
    SELECT id FROM evaluators WHERE email = auth.jwt()->>'email'
  )
);

-- Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'evaluations';
