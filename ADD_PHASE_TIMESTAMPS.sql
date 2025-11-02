-- ==========================================
-- ADICIONAR CAMPOS DE TIMESTAMPS DE FASE
-- ==========================================
-- Execute isso no Supabase SQL Editor para adicionar os campos que faltam

-- Adicionar colunas de timestamp para cada fase (1-5)
ALTER TABLE event_config
ADD COLUMN IF NOT EXISTS phase_1_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS phase_2_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS phase_3_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS phase_4_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS phase_5_start_time TIMESTAMP;

-- Adicionar timestamp do event start e end
ALTER TABLE event_config
ADD COLUMN IF NOT EXISTS event_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS event_end_time TIMESTAMP;

-- Verificar que os campos foram adicionados
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'event_config'
ORDER BY ordinal_position;
