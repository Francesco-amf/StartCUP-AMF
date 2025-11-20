-- Verificar e corrigir foreign key constraint de mentor_requests
-- Execute no SQL Editor do Supabase

-- 1. Verificar constraints existentes
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='mentor_requests';

-- 2. Se a constraint não existir ou estiver errada, recriar:
-- Primeiro remover constraint antiga (se existir)
ALTER TABLE mentor_requests 
DROP CONSTRAINT IF EXISTS mentor_requests_mentor_id_fkey;

-- Criar nova constraint correta
ALTER TABLE mentor_requests
ADD CONSTRAINT mentor_requests_mentor_id_fkey 
FOREIGN KEY (mentor_id) 
REFERENCES evaluators(id)
ON DELETE CASCADE;

-- 3. Verificar novamente
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='mentor_requests';
