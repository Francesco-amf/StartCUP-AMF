-- Adicionar campo mentor_response para feedback do mentor
-- Executar no SQL Editor do Supabase

-- 1. Adicionar coluna mentor_response à tabela mentor_requests
ALTER TABLE mentor_requests 
ADD COLUMN IF NOT EXISTS mentor_response TEXT;

COMMENT ON COLUMN mentor_requests.mentor_response IS 'Mensagem do mentor ao aceitar/recusar/concluir a mentoria';

-- 2. Verificar estrutura atualizada
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'mentor_requests'
ORDER BY ordinal_position;
