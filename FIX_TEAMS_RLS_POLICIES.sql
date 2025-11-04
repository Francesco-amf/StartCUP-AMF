-- ==========================================
-- 🔧 CORRIGIR POLÍTICAS RLS DA TABELA TEAMS
-- ==========================================
-- Problema: Recursão infinita nas políticas RLS
-- Solução: Usar auth.uid() e auth.jwt() sem subqueries
-- ==========================================

-- 1. REMOVER TODAS as políticas existentes (começar do zero)
DROP POLICY IF EXISTS "Teams can view evaluators" ON teams;
DROP POLICY IF EXISTS "Teams can view evaluators and themselves" ON teams;
DROP POLICY IF EXISTS "Users can view own team" ON teams;
DROP POLICY IF EXISTS "Users can update own team" ON teams;
DROP POLICY IF EXISTS "Enable read access for all users" ON teams;

-- 2. CRIAR política para leitura (SELECT)
-- Permite:
-- - Ver mentores/avaliadores (course = 'Avaliação')
-- - Ver admin (course = 'Administration')
-- - Ver a própria equipe (usando auth.uid)
CREATE POLICY "Allow teams to view evaluators and own data"
  ON teams FOR SELECT
  TO authenticated
  USING (
    course = 'Avaliação'           -- Ver mentores
    OR course = 'Administration'   -- Ver admin
    OR auth.uid()::text = id::text -- Ver própria equipe
  );

-- 3. CRIAR política para atualização (UPDATE)
-- Permite apenas atualizar a própria equipe
CREATE POLICY "Allow teams to update own data"
  ON teams FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- 4. VERIFICAR se as políticas foram criadas corretamente
SELECT 
  policyname,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'teams'
ORDER BY policyname;

-- ==========================================
-- 📝 NOTAS
-- ==========================================
-- auth.uid() retorna o UUID do usuário autenticado
-- Isso evita subqueries recursivas na própria tabela teams
-- ==========================================
