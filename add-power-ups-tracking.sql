-- Adicionar coluna para rastrear se o power-up foi usado nesta fase
ALTER TABLE power_ups
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'used', 'pending'));

-- Criar índice para buscar rapidamente power-ups ativos por equipe e fase
CREATE INDEX IF NOT EXISTS idx_power_ups_team_phase_status
ON power_ups(team_id, phase_used, status);

-- Criar view para facilitar a busca de power-ups disponíveis
CREATE OR REPLACE VIEW team_power_ups_available AS
SELECT
  t.id as team_id,
  t.name as team_name,
  ec.current_phase,
  CASE
    WHEN COUNT(p.id) > 0 THEN FALSE
    ELSE TRUE
  END as can_use_power_up,
  COALESCE(p.power_up_type, NULL) as used_power_up_type
FROM teams t
CROSS JOIN event_config ec
LEFT JOIN power_ups p ON p.team_id = t.id
  AND p.phase_used = ec.current_phase
  AND p.status = 'used'
GROUP BY t.id, t.name, ec.current_phase, p.power_up_type;
