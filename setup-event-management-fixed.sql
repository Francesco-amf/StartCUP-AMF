-- ==========================================
-- STARTCUP AMF - SISTEMA DE GERENCIAMENTO DE EVENTO (VERSÃO CORRIGIDA)
-- ==========================================
-- Este script cria ou atualiza as tabelas necessárias para gerenciar o evento completo

-- ==========================================
-- TABELA: event_config
-- Gerencia o estado atual do evento
-- ==========================================

-- Criar a tabela se não existir
CREATE TABLE IF NOT EXISTS event_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_phase INTEGER DEFAULT 0,
  event_started BOOLEAN DEFAULT FALSE,
  event_ended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar colunas que podem não existir (não dá erro se já existirem)
DO $$
BEGIN
  -- Adicionar event_name se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='event_config' AND column_name='event_name') THEN
    ALTER TABLE event_config ADD COLUMN event_name VARCHAR(255) DEFAULT 'StartCup AMF 2025';
  END IF;

  -- Adicionar phase_1_start_time se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='event_config' AND column_name='phase_1_start_time') THEN
    ALTER TABLE event_config ADD COLUMN phase_1_start_time TIMESTAMP;
  END IF;

  -- Adicionar phase_2_start_time se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='event_config' AND column_name='phase_2_start_time') THEN
    ALTER TABLE event_config ADD COLUMN phase_2_start_time TIMESTAMP;
  END IF;

  -- Adicionar phase_3_start_time se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='event_config' AND column_name='phase_3_start_time') THEN
    ALTER TABLE event_config ADD COLUMN phase_3_start_time TIMESTAMP;
  END IF;

  -- Adicionar phase_4_start_time se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='event_config' AND column_name='phase_4_start_time') THEN
    ALTER TABLE event_config ADD COLUMN phase_4_start_time TIMESTAMP;
  END IF;

  -- Adicionar phase_5_start_time se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='event_config' AND column_name='phase_5_start_time') THEN
    ALTER TABLE event_config ADD COLUMN phase_5_start_time TIMESTAMP;
  END IF;

  -- Adicionar event_start_time se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='event_config' AND column_name='event_start_time') THEN
    ALTER TABLE event_config ADD COLUMN event_start_time TIMESTAMP;
  END IF;

  -- Adicionar event_end_time se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='event_config' AND column_name='event_end_time') THEN
    ALTER TABLE event_config ADD COLUMN event_end_time TIMESTAMP;
  END IF;
END $$;

-- Inserir configuração padrão se não existir
INSERT INTO event_config (id, current_phase, event_started, event_ended)
VALUES ('00000000-0000-0000-0000-000000000001', 0, FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Atualizar event_name se existir
UPDATE event_config
SET event_name = 'StartCup AMF 2025'
WHERE id = '00000000-0000-0000-0000-000000000001' AND event_name IS NULL;

-- ==========================================
-- TABELA: power_ups
-- Registra os power-ups usados pelas equipes
-- ==========================================
CREATE TABLE IF NOT EXISTS power_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  power_up_type VARCHAR(50) NOT NULL, -- 'mentoria', 'dica', 'validacao', 'checkpoint'
  phase_used INTEGER NOT NULL, -- Em qual fase foi usado
  used_at TIMESTAMP DEFAULT NOW(),
  mentor_id UUID REFERENCES evaluators(id), -- Se for mentoria, qual mentor
  notes TEXT, -- Observações sobre o uso
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_power_ups_team ON power_ups(team_id);
CREATE INDEX IF NOT EXISTS idx_power_ups_phase ON power_ups(phase_used);

-- ==========================================
-- TABELA: achievements
-- Achievements especiais conquistados pelas equipes
-- ==========================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL, -- 'coruja', 'perfeccionista', 'velocista', 'inovador', 'team_player', 'visionario'
  achievement_name VARCHAR(100) NOT NULL,
  achievement_description TEXT,
  bonus_points INTEGER DEFAULT 0,
  awarded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_achievements_team ON achievements(team_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);

-- ==========================================
-- TABELA: boss_battles
-- Avaliações especiais dos "BOSS" de cada fase
-- ==========================================
CREATE TABLE IF NOT EXISTS boss_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL, -- 1-5 para cada fase
  evaluator_id UUID REFERENCES evaluators(id),
  points INTEGER NOT NULL CHECK (points >= 0 AND points <= 100), -- 0-100 pontos para fases 1-4
  comments TEXT,
  evaluated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, phase) -- Uma equipe só pode ter uma avaliação de BOSS por fase
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_boss_battles_team ON boss_battles(team_id);
CREATE INDEX IF NOT EXISTS idx_boss_battles_phase ON boss_battles(phase);

-- ==========================================
-- TABELA: final_pitch
-- Avaliação do pitch final (ÚLTIMO CHEFÃO)
-- ==========================================
CREATE TABLE IF NOT EXISTS final_pitch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES evaluators(id),
  points INTEGER NOT NULL CHECK (points >= 0 AND points <= 200), -- 0-200 pontos
  viability_score INTEGER, -- 0-100 (30% do total)
  innovation_score INTEGER, -- 0-100 (20% do total)
  pitch_quality_score INTEGER, -- 0-100 (10% do total)
  comments TEXT,
  evaluated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_final_pitch_team ON final_pitch(team_id);
CREATE INDEX IF NOT EXISTS idx_final_pitch_evaluator ON final_pitch(evaluator_id);

-- ==========================================
-- TABELA: penalties
-- Penalidades aplicadas às equipes
-- ==========================================
CREATE TABLE IF NOT EXISTS penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  penalty_type VARCHAR(50) NOT NULL, -- 'plagio', 'desorganizacao', 'desrespeito', 'ausencia', 'atraso'
  penalty_description TEXT NOT NULL,
  points_deducted INTEGER NOT NULL, -- Pontos deduzidos
  applied_by UUID REFERENCES evaluators(id), -- Admin/avaliador que aplicou
  applied_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_penalties_team ON penalties(team_id);
CREATE INDEX IF NOT EXISTS idx_penalties_type ON penalties(penalty_type);

-- ==========================================
-- VIEW: team_stats
-- Estatísticas completas de cada equipe
-- ==========================================
DROP VIEW IF EXISTS team_stats CASCADE;

CREATE VIEW team_stats AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,

  -- Pontos das quests normais (40% da avaliação final)
  COALESCE(SUM(s.final_points), 0) as quest_points,

  -- Pontos dos BOSS battles
  COALESCE(SUM(bb.points), 0) as boss_points,

  -- Pontos do pitch final
  COALESCE(
    (SELECT SUM(fp.points) FROM final_pitch fp WHERE fp.team_id = t.id),
    0
  ) as final_pitch_points,

  -- Pontos de achievements
  COALESCE(
    (SELECT SUM(a.bonus_points) FROM achievements a WHERE a.team_id = t.id),
    0
  ) as achievement_points,

  -- Penalidades
  COALESCE(
    (SELECT SUM(p.points_deducted) FROM penalties p WHERE p.team_id = t.id),
    0
  ) as penalty_points,

  -- Total de pontos (quest + boss + final pitch + achievements - penalties)
  COALESCE(SUM(s.final_points), 0) +
  COALESCE(SUM(bb.points), 0) +
  COALESCE((SELECT SUM(fp.points) FROM final_pitch fp WHERE fp.team_id = t.id), 0) +
  COALESCE((SELECT SUM(a.bonus_points) FROM achievements a WHERE a.team_id = t.id), 0) -
  COALESCE((SELECT SUM(p.points_deducted) FROM penalties p WHERE p.team_id = t.id), 0)
  as total_points,

  -- Contadores
  COUNT(DISTINCT s.id) as submissions_completed,
  COUNT(DISTINCT bb.id) as boss_battles_completed,

  -- Power-ups usados
  COALESCE(
    (SELECT COUNT(*) FROM power_ups pu WHERE pu.team_id = t.id),
    0
  ) as power_ups_used

FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id AND s.status = 'evaluated'
LEFT JOIN boss_battles bb ON t.id = bb.team_id
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

-- ==========================================
-- POLÍTICAS RLS (Row Level Security)
-- ==========================================

-- event_config
ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos podem ver config do evento" ON event_config;
CREATE POLICY "Todos podem ver config do evento" ON event_config FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Apenas admin pode atualizar config" ON event_config;
CREATE POLICY "Apenas admin pode atualizar config" ON event_config FOR UPDATE TO authenticated USING (true);

-- power_ups
ALTER TABLE power_ups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos podem ver power ups" ON power_ups;
CREATE POLICY "Todos podem ver power ups" ON power_ups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin pode inserir power ups" ON power_ups;
CREATE POLICY "Admin pode inserir power ups" ON power_ups FOR INSERT TO authenticated WITH CHECK (true);

-- achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos podem ver achievements" ON achievements;
CREATE POLICY "Todos podem ver achievements" ON achievements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin pode inserir achievements" ON achievements;
CREATE POLICY "Admin pode inserir achievements" ON achievements FOR INSERT TO authenticated WITH CHECK (true);

-- boss_battles
ALTER TABLE boss_battles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos podem ver boss battles" ON boss_battles;
CREATE POLICY "Todos podem ver boss battles" ON boss_battles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Avaliadores podem inserir boss battles" ON boss_battles;
CREATE POLICY "Avaliadores podem inserir boss battles" ON boss_battles FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Avaliadores podem atualizar boss battles" ON boss_battles;
CREATE POLICY "Avaliadores podem atualizar boss battles" ON boss_battles FOR UPDATE TO authenticated USING (true);

-- final_pitch
ALTER TABLE final_pitch ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos podem ver final pitch" ON final_pitch;
CREATE POLICY "Todos podem ver final pitch" ON final_pitch FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Avaliadores podem inserir final pitch" ON final_pitch;
CREATE POLICY "Avaliadores podem inserir final pitch" ON final_pitch FOR INSERT TO authenticated WITH CHECK (true);

-- penalties
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos podem ver penalties" ON penalties;
CREATE POLICY "Todos podem ver penalties" ON penalties FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin pode inserir penalties" ON penalties;
CREATE POLICY "Admin pode inserir penalties" ON penalties FOR INSERT TO authenticated WITH CHECK (true);

-- Grants para a view
GRANT SELECT ON team_stats TO authenticated;
GRANT SELECT ON team_stats TO anon;

-- ==========================================
-- SUCESSO!
-- ==========================================
SELECT 'Setup completo! Todas as tabelas foram criadas/atualizadas.' as status;
