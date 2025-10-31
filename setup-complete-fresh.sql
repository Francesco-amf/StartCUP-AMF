-- ==========================================
-- STARTCUP AMF - SETUP COMPLETO E LIMPO
-- ==========================================
-- Remove TODAS as views e tabelas antigas e cria tudo do zero

-- ==========================================
-- PASSO 1: REMOVER TODAS AS VIEWS ANTIGAS
-- ==========================================
DROP VIEW IF EXISTS live_ranking CASCADE;
DROP VIEW IF EXISTS team_stats CASCADE;

-- ==========================================
-- PASSO 2: REMOVER TABELAS ANTIGAS
-- ==========================================
DROP TABLE IF EXISTS penalties CASCADE;
DROP TABLE IF EXISTS final_pitch CASCADE;
DROP TABLE IF EXISTS boss_battles CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS power_ups CASCADE;
DROP TABLE IF EXISTS event_config CASCADE;

-- ==========================================
-- PASSO 3: CRIAR TABELA event_config
-- ==========================================
CREATE TABLE event_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) DEFAULT 'StartCup AMF 2025',
  current_phase INTEGER DEFAULT 0,
  event_started BOOLEAN DEFAULT FALSE,
  event_ended BOOLEAN DEFAULT FALSE,
  phase_1_start_time TIMESTAMP,
  phase_2_start_time TIMESTAMP,
  phase_3_start_time TIMESTAMP,
  phase_4_start_time TIMESTAMP,
  phase_5_start_time TIMESTAMP,
  event_start_time TIMESTAMP,
  event_end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO event_config (id, event_name, current_phase, event_started, event_ended)
VALUES ('00000000-0000-0000-0000-000000000001', 'StartCup AMF 2025', 0, FALSE, FALSE);

-- ==========================================
-- PASSO 4: CRIAR OUTRAS TABELAS
-- ==========================================

-- power_ups
CREATE TABLE power_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  power_up_type VARCHAR(50) NOT NULL,
  phase_used INTEGER NOT NULL,
  used_at TIMESTAMP DEFAULT NOW(),
  mentor_id UUID REFERENCES evaluators(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_power_ups_team ON power_ups(team_id);
CREATE INDEX idx_power_ups_phase ON power_ups(phase_used);

-- achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(100) NOT NULL,
  achievement_description TEXT,
  bonus_points INTEGER DEFAULT 0,
  awarded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_achievements_team ON achievements(team_id);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);

-- boss_battles
CREATE TABLE boss_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL,
  evaluator_id UUID REFERENCES evaluators(id),
  points INTEGER NOT NULL CHECK (points >= 0 AND points <= 100),
  comments TEXT,
  evaluated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, phase)
);

CREATE INDEX idx_boss_battles_team ON boss_battles(team_id);
CREATE INDEX idx_boss_battles_phase ON boss_battles(phase);

-- final_pitch
CREATE TABLE final_pitch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES evaluators(id),
  points INTEGER NOT NULL CHECK (points >= 0 AND points <= 200),
  viability_score INTEGER,
  innovation_score INTEGER,
  pitch_quality_score INTEGER,
  comments TEXT,
  evaluated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_final_pitch_team ON final_pitch(team_id);
CREATE INDEX idx_final_pitch_evaluator ON final_pitch(evaluator_id);

-- penalties
CREATE TABLE penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  penalty_type VARCHAR(50) NOT NULL,
  penalty_description TEXT NOT NULL,
  points_deducted INTEGER NOT NULL,
  applied_by UUID REFERENCES evaluators(id),
  applied_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_penalties_team ON penalties(team_id);
CREATE INDEX idx_penalties_type ON penalties(penalty_type);

-- ==========================================
-- PASSO 5: CRIAR VIEW live_ranking (corrigida)
-- ==========================================
CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  COALESCE(SUM(s.final_points), 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

-- ==========================================
-- PASSO 6: CRIAR VIEW team_stats (completa)
-- ==========================================
CREATE VIEW team_stats AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  COALESCE(SUM(s.final_points), 0) as quest_points,
  COALESCE(
    (SELECT SUM(bb.points) FROM boss_battles bb WHERE bb.team_id = t.id),
    0
  ) as boss_points,
  COALESCE(
    (SELECT SUM(fp.points) FROM final_pitch fp WHERE fp.team_id = t.id),
    0
  ) as final_pitch_points,
  COALESCE(
    (SELECT SUM(a.bonus_points) FROM achievements a WHERE a.team_id = t.id),
    0
  ) as achievement_points,
  COALESCE(
    (SELECT SUM(p.points_deducted) FROM penalties p WHERE p.team_id = t.id),
    0
  ) as penalty_points,
  COALESCE(SUM(s.final_points), 0) +
  COALESCE((SELECT SUM(bb.points) FROM boss_battles bb WHERE bb.team_id = t.id), 0) +
  COALESCE((SELECT SUM(fp.points) FROM final_pitch fp WHERE fp.team_id = t.id), 0) +
  COALESCE((SELECT SUM(a.bonus_points) FROM achievements a WHERE a.team_id = t.id), 0) -
  COALESCE((SELECT SUM(p.points_deducted) FROM penalties p WHERE p.team_id = t.id), 0)
  as total_points,
  COUNT(DISTINCT s.id) as submissions_completed,
  COALESCE(
    (SELECT COUNT(DISTINCT bb.id) FROM boss_battles bb WHERE bb.team_id = t.id),
    0
  ) as boss_battles_completed,
  COALESCE(
    (SELECT COUNT(*) FROM power_ups pu WHERE pu.team_id = t.id),
    0
  ) as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id AND s.status = 'evaluated'
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

-- ==========================================
-- PASSO 7: POLÍTICAS RLS
-- ==========================================

-- event_config
ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver config do evento" ON event_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Apenas admin pode atualizar config" ON event_config FOR UPDATE TO authenticated USING (true);

-- power_ups
ALTER TABLE power_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver power ups" ON power_ups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin pode inserir power ups" ON power_ups FOR INSERT TO authenticated WITH CHECK (true);

-- achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver achievements" ON achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin pode inserir achievements" ON achievements FOR INSERT TO authenticated WITH CHECK (true);

-- boss_battles
ALTER TABLE boss_battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver boss battles" ON boss_battles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Avaliadores podem inserir boss battles" ON boss_battles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Avaliadores podem atualizar boss battles" ON boss_battles FOR UPDATE TO authenticated USING (true);

-- final_pitch
ALTER TABLE final_pitch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver final pitch" ON final_pitch FOR SELECT TO authenticated USING (true);
CREATE POLICY "Avaliadores podem inserir final pitch" ON final_pitch FOR INSERT TO authenticated WITH CHECK (true);

-- penalties
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver penalties" ON penalties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin pode inserir penalties" ON penalties FOR INSERT TO authenticated WITH CHECK (true);

-- Grants para views
GRANT SELECT ON live_ranking TO authenticated;
GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON team_stats TO authenticated;
GRANT SELECT ON team_stats TO anon;

-- ==========================================
-- SUCESSO!
-- ==========================================
SELECT
  'Setup completo! Todas as tabelas e views foram criadas.' as status,
  (SELECT COUNT(*) FROM event_config) as event_config_count,
  (SELECT current_phase FROM event_config WHERE id = '00000000-0000-0000-0000-000000000001') as current_phase,
  (SELECT COUNT(*) FROM teams) as teams_count;
