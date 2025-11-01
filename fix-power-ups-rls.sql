-- Garantir que a tabela power_ups existe com status correto
ALTER TABLE power_ups
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'used', 'pending'));

-- Desabilitar RLS temporariamente para poder inserir dados
ALTER TABLE power_ups DISABLE ROW LEVEL SECURITY;

-- Criar políticas de RLS para power_ups
CREATE POLICY "Enable read power_ups" ON power_ups
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert power_ups" ON power_ups
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update power_ups" ON power_ups
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Reabilitar RLS
ALTER TABLE power_ups ENABLE ROW LEVEL SECURITY;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_power_ups_team_phase_status
ON power_ups(team_id, phase_used, status);

CREATE INDEX IF NOT EXISTS idx_power_ups_team_id
ON power_ups(team_id);

CREATE INDEX IF NOT EXISTS idx_power_ups_phase
ON power_ups(phase_used);
