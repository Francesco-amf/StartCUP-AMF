-- ==========================================
-- PENALTIES SYSTEM - Database Setup
-- ==========================================

-- Create penalties table
CREATE TABLE IF NOT EXISTS penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  penalty_type VARCHAR(50) NOT NULL CHECK (penalty_type IN ('plagio', 'desorganizacao', 'desrespeito', 'ausencia', 'atraso')),
  points_deduction INTEGER NOT NULL CHECK (points_deduction >= 0 AND points_deduction <= 100),
  reason TEXT,
  phase_applied INTEGER,
  assigned_by_admin BOOLEAN DEFAULT FALSE,
  assigned_by_evaluator_id UUID REFERENCES evaluators(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_penalties_team ON penalties(team_id);
CREATE INDEX IF NOT EXISTS idx_penalties_type ON penalties(penalty_type);
CREATE INDEX IF NOT EXISTS idx_penalties_phase ON penalties(phase_applied);
CREATE INDEX IF NOT EXISTS idx_penalties_evaluator ON penalties(assigned_by_evaluator_id);

-- Enable RLS on penalties table
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for penalties
CREATE POLICY "Allow all read access" ON penalties
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert access" ON penalties
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update access" ON penalties
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow all delete access" ON penalties
  FOR DELETE USING (true);

-- Verify table creation
SELECT 'Penalties table created successfully!' as status,
  COUNT(*) as existing_penalties
FROM penalties;
