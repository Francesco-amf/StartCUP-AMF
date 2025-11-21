-- ============================================================================
-- SOLUÇÃO DEFINITIVA PARA PROBLEMA DE TIMEZONE
-- ============================================================================
-- PROBLEMA: Colunas timestamp without time zone fazem Postgres interpretar
--           valores UTC como horário local, causando offset de 3 horas
-- 
-- IMPACTO ATUAL: 
--   - Sistema funciona corretamente (cálculos baseados em milliseconds)
--   - Apenas relatórios/displays mostram hora errada
--
-- SOLUÇÃO: Converter colunas para TIMESTAMPTZ (timestamp with time zone)
-- ============================================================================

-- BACKUP: Ver estrutura atual
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('event_config', 'quests')
  AND column_name LIKE '%time%' OR column_name LIKE '%at'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- OPÇÃO 1: CONVERTER COLUNAS PARA TIMESTAMPTZ (RECOMENDADO)
-- ============================================================================
-- Esta é a solução correta e permanente

BEGIN;

-- Event Config
ALTER TABLE event_config
  ALTER COLUMN event_start_time TYPE TIMESTAMPTZ USING event_start_time AT TIME ZONE 'UTC',
  ALTER COLUMN event_end_time TYPE TIMESTAMPTZ USING event_end_time AT TIME ZONE 'UTC',
  ALTER COLUMN evaluation_period_end_time TYPE TIMESTAMPTZ USING evaluation_period_end_time AT TIME ZONE 'UTC',
  ALTER COLUMN phase_1_start_time TYPE TIMESTAMPTZ USING phase_1_start_time AT TIME ZONE 'UTC',
  ALTER COLUMN phase_2_start_time TYPE TIMESTAMPTZ USING phase_2_start_time AT TIME ZONE 'UTC',
  ALTER COLUMN phase_3_start_time TYPE TIMESTAMPTZ USING phase_3_start_time AT TIME ZONE 'UTC',
  ALTER COLUMN phase_4_start_time TYPE TIMESTAMPTZ USING phase_4_start_time AT TIME ZONE 'UTC',
  ALTER COLUMN phase_5_start_time TYPE TIMESTAMPTZ USING phase_5_start_time AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Quests
ALTER TABLE quests
  ALTER COLUMN started_at TYPE TIMESTAMPTZ USING started_at AT TIME ZONE 'UTC',
  ALTER COLUMN ended_at TYPE TIMESTAMPTZ USING ended_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Submissions (se tiver problemas também)
ALTER TABLE submissions
  ALTER COLUMN submitted_at TYPE TIMESTAMPTZ USING submitted_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Evaluations
ALTER TABLE evaluations
  ALTER COLUMN evaluated_at TYPE TIMESTAMPTZ USING evaluated_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

COMMIT;

-- ============================================================================
-- OPÇÃO 2: MANTER COMO ESTÁ E DOCUMENTAR (SE NÃO QUISER MUDAR SCHEMA)
-- ============================================================================
-- Se preferir não alterar o schema agora, apenas documente o comportamento

-- Adicionar comentários nas colunas explicando o comportamento
COMMENT ON COLUMN event_config.event_start_time IS 'ATENÇÃO: timestamp without time zone - armazenado em UTC mas interpretado como local pelo Postgres';
COMMENT ON COLUMN quests.started_at IS 'ATENÇÃO: timestamp without time zone - armazenado em UTC mas interpretado como local pelo Postgres';
COMMENT ON COLUMN quests.ended_at IS 'ATENÇÃO: timestamp without time zone - armazenado em UTC mas interpretado como local pelo Postgres';

-- ============================================================================
-- VERIFICAÇÃO PÓS-CONVERSÃO
-- ============================================================================

-- Ver nova estrutura
SELECT 
  table_name,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name IN ('event_config', 'quests', 'submissions', 'evaluations')
  AND (column_name LIKE '%time%' OR column_name LIKE '%_at')
ORDER BY table_name, ordinal_position;

-- Testar valores após conversão
SELECT 
  event_start_time,
  phase_1_start_time,
  event_start_time::text as start_raw,
  phase_1_start_time::text as phase1_raw
FROM event_config
WHERE event_started = true;

-- Verificar quests
SELECT 
  name,
  started_at,
  ended_at,
  started_at::text as started_raw,
  ended_at::text as ended_raw
FROM quests
WHERE started_at IS NOT NULL
ORDER BY phase_id, order_index
LIMIT 5;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. TIMESTAMPTZ armazena internamente em UTC mas sempre mostra com timezone
-- 2. JavaScript/TypeScript new Date() entende TIMESTAMPTZ corretamente
-- 3. Sem necessidade de conversões manuais de timezone no código
-- 4. Todos os cálculos de diferença de tempo continuam funcionando
-- 5. Displays automáticos mostrarão hora correta
--
-- QUANDO EXECUTAR:
-- - ANTES do evento de hoje à noite (se quiser garantir 100% de precisão visual)
-- - OU depois do evento (não afeta funcionalidade durante)
-- ============================================================================
