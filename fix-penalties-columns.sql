-- ==========================================
-- CORRIGIR COLUNAS DA TABELA PENALTIES
-- ==========================================

-- Verificar estrutura atual
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'penalties'
ORDER BY ordinal_position;

-- Adicionar coluna points_deduction se não existir
ALTER TABLE penalties
ADD COLUMN IF NOT EXISTS points_deduction INTEGER CHECK (points_deduction >= 0 AND points_deduction <= 100);

-- Se houver points_deducted, migrar os dados
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'penalties' AND column_name = 'points_deducted'
  ) THEN
    UPDATE penalties SET points_deduction = points_deducted WHERE points_deduction IS NULL;
    ALTER TABLE penalties DROP COLUMN points_deducted;
  END IF;
END
$$;

-- Verificar colunas novamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'penalties'
ORDER BY ordinal_position;

-- Verificar dados
SELECT id, team_id, penalty_type, points_deduction, assigned_by_admin, created_at
FROM penalties
LIMIT 10;
