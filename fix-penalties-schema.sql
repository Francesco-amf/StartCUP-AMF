-- ==========================================
-- DIAGNOSTICAR E CORRIGIR ESQUEMA PENALTIES
-- ==========================================

-- 1. Ver estrutura atual
\echo 'Estrutura atual de penalties:'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'penalties'
ORDER BY ordinal_position;

-- 2. Se a tabela não tem as colunas corretas, recriar
DROP TABLE IF EXISTS penalties CASCADE;

CREATE TABLE penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  penalty_type VARCHAR(50) NOT NULL CHECK (penalty_type IN ('plagio', 'desorganizacao', 'desrespeito', 'ausencia', 'atraso')),
  points_deduction INTEGER NOT NULL DEFAULT 0 CHECK (points_deduction >= 0 AND points_deduction <= 100),
  reason TEXT,
  phase_applied INTEGER,
  assigned_by_admin BOOLEAN DEFAULT FALSE,
  assigned_by_evaluator_id UUID REFERENCES evaluators(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Criar indices
CREATE INDEX idx_penalties_team ON penalties(team_id);
CREATE INDEX idx_penalties_type ON penalties(penalty_type);
CREATE INDEX idx_penalties_phase ON penalties(phase_applied);
CREATE INDEX idx_penalties_evaluator ON penalties(assigned_by_evaluator_id);
CREATE INDEX idx_penalties_created ON penalties(created_at);

-- 4. Enable RLS
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Allow all read access" ON penalties
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert access" ON penalties
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update access" ON penalties
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow all delete access" ON penalties
  FOR DELETE USING (true);

-- 6. Verificar resultado
\echo 'Nova estrutura de penalties:'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'penalties'
ORDER BY ordinal_position;

SELECT 'Tabela penalties criada/atualizada com sucesso!' as status;
