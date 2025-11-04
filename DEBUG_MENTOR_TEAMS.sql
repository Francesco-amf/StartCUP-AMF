-- ==========================================
-- 🔍 DEBUG: Verificar mentores disponíveis
-- ==========================================

-- 1. Verificar se existem mentores com course='Avaliação'
SELECT 
  id,
  name,
  email,
  course,
  created_at
FROM teams
WHERE course = 'Avaliação'
ORDER BY name;

-- 2. Verificar TODAS as políticas RLS na tabela teams
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'teams';

-- 3. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'teams';

-- ==========================================
-- 💡 SOLUÇÃO CORRIGIDA
-- ==========================================
-- Remover a política recursiva e criar uma correta
-- que usa apenas auth.jwt() sem subquery

-- 1. REMOVER a política que causa recursão
DROP POLICY IF EXISTS "Teams can view evaluators" ON teams;

-- 2. CRIAR política correta usando auth.uid() diretamente
CREATE POLICY "Teams can view evaluators and themselves"
  ON teams FOR SELECT
  TO authenticated
  USING (
    course = 'Avaliação'  -- Permitir ver avaliadores (mentores)
    OR
    auth.uid()::text = id::text  -- Ou ver a própria equipe usando auth.uid()
  );
