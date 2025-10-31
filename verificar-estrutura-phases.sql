-- VERIFICAR ESTRUTURA DA TABELA PHASES

-- 1. Verificar informações das colunas da tabela phases
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'phases'
ORDER BY ordinal_position;

-- 2. Verificar dados existentes na tabela phases
SELECT * FROM phases ORDER BY id;

-- 3. Verificar chaves primárias e foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'phases';
