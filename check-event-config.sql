-- ==========================================
-- VERIFICAR EVENT_CONFIG
-- ==========================================

-- 1. Verificar se a tabela existe
SELECT
  'Tabela event_config existe?' as pergunta,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'event_config'
  ) as resposta;

-- 2. Se existir, mostrar conteúdo
SELECT * FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. Verificar estrutura da tabela
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'event_config'
ORDER BY ordinal_position;
