-- Criar tabela power_ups se não existir
CREATE TABLE IF NOT EXISTS power_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  power_up_type VARCHAR(50) NOT NULL,
  phase_used INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'used',
  used_at TIMESTAMP DEFAULT NOW(),
  mentor_id UUID REFERENCES evaluators(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_power_ups_team_id ON power_ups(team_id);
CREATE INDEX IF NOT EXISTS idx_power_ups_phase_used ON power_ups(phase_used);
CREATE INDEX IF NOT EXISTS idx_power_ups_team_phase ON power_ups(team_id, phase_used);
CREATE INDEX IF NOT EXISTS idx_power_ups_team_phase_status ON power_ups(team_id, phase_used, status);

-- Habilitar RLS
ALTER TABLE power_ups ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura de power-ups" ON power_ups;
DROP POLICY IF EXISTS "Permitir inserção de power-ups" ON power_ups;
DROP POLICY IF EXISTS "Permitir atualização de power-ups" ON power_ups;

-- Criar novas políticas RLS (permissivo para testes)
CREATE POLICY "Permitir leitura de power-ups" ON power_ups
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de power-ups" ON power_ups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de power-ups" ON power_ups
  FOR UPDATE USING (true);

-- Dar permissões ao serviço anon
GRANT ALL PRIVILEGES ON power_ups TO anon;
GRANT ALL PRIVILEGES ON power_ups TO authenticated;
