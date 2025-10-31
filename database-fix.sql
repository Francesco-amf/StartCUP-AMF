-- ========================================
-- SCRIPT DE CORREÇÃO DO BANCO DE DADOS
-- StartCup AMF - Sistema de Avaliações
-- ========================================
-- Execute este script completo no SQL Editor do Supabase
-- ========================================

-- 1. ADICIONAR COLUNAS NA TABELA EVALUATIONS (se não existirem)
-- Essas colunas armazenam os detalhes de cada avaliação
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS base_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS multiplier DECIMAL(3,2) DEFAULT 1.0;

-- 2. ATUALIZAR AVALIAÇÕES EXISTENTES
-- Para avaliações já feitas, assumir que points = base_points
UPDATE evaluations
SET
  base_points = points,
  bonus_points = 0,
  multiplier = 1.0
WHERE base_points = 0 OR base_points IS NULL;

-- 3. RECALCULAR final_points EM SUBMISSIONS
-- Calcular média das avaliações e atualizar submissions
UPDATE submissions s
SET final_points = (
  SELECT COALESCE(ROUND(AVG(e.points)), 0)
  FROM evaluations e
  WHERE e.submission_id = s.id
)
WHERE EXISTS (
  SELECT 1 FROM evaluations e WHERE e.submission_id = s.id
);

-- 4. REMOVER COLUNAS DESNECESSÁRIAS DE SUBMISSIONS
-- base_points, bonus_points, multiplier devem estar apenas em evaluations
ALTER TABLE submissions
DROP COLUMN IF EXISTS base_points,
DROP COLUMN IF EXISTS bonus_points,
DROP COLUMN IF EXISTS multiplier;

-- 5. CRIAR/ATUALIZAR POLÍTICAS RLS
-- Permitir que a API atualize submissions
DROP POLICY IF EXISTS "Service can update submissions" ON submissions;
CREATE POLICY "Service can update submissions"
ON submissions FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ========================================
-- VERIFICAÇÕES (resultados aparecerão abaixo)
-- ========================================

-- Verificar estrutura da tabela evaluations
SELECT
  'Colunas de evaluations:' as info,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'evaluations'
ORDER BY ordinal_position;

-- Verificar submissions atualizadas
SELECT
  'Submissions após atualização:' as info,
  id,
  status,
  final_points,
  (SELECT COUNT(*) FROM evaluations WHERE submission_id = submissions.id) as eval_count,
  (SELECT AVG(points) FROM evaluations WHERE submission_id = submissions.id) as avg_points
FROM submissions
WHERE status = 'evaluated';

-- Verificar evaluations com detalhes
SELECT
  'Evaluations com detalhes:' as info,
  e.id,
  e.submission_id,
  e.base_points,
  e.bonus_points,
  e.multiplier,
  e.points as calculated_points
FROM evaluations e
ORDER BY e.created_at DESC
LIMIT 10;

-- ========================================
-- FIM DO SCRIPT
-- ========================================
-- Sucesso! O banco de dados foi atualizado.
-- ========================================
