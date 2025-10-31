-- ==========================================
-- ADICIONAR COLUNA current_phase_id
-- ==========================================
-- Esta coluna armazena o UUID da fase atual da tabela phases

-- 1. Adicionar a coluna current_phase_id (pode ser NULL)
ALTER TABLE event_config
ADD COLUMN IF NOT EXISTS current_phase_id UUID REFERENCES phases(id);

-- 2. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_event_config_current_phase_id
ON event_config(current_phase_id);

-- 3. Popular a coluna com base no current_phase atual (se houver)
-- Isso sincroniza o estado atual
UPDATE event_config
SET current_phase_id = (
  SELECT id
  FROM phases
  WHERE phase_number = event_config.current_phase
)
WHERE current_phase >= 1;

-- 4. Verificar resultado
SELECT
  'Estado Atualizado' as info,
  event_started,
  event_ended,
  current_phase,
  current_phase_id,
  event_start_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 5. Verificar se a fase está corretamente referenciada
SELECT
  'Fase Atual' as info,
  id,
  phase_number,
  name,
  duration_minutes
FROM phases
WHERE id = (
  SELECT current_phase_id
  FROM event_config
  WHERE id = '00000000-0000-0000-0000-000000000001'
);
