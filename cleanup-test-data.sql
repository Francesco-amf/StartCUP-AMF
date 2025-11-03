-- ==========================================
-- LIMPAR DADOS DE TESTE PARA PRODUÇÃO
-- ==========================================
-- Execute isso para preparar o sistema para 15 equipes reais

-- 1. Remover penalidades de teste
DELETE FROM penalties
WHERE team_id IN (
  SELECT id FROM teams
  WHERE email IN ('admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com')
);

-- 2. Remover power-ups de teste
DELETE FROM power_ups
WHERE team_id IN (
  SELECT id FROM teams
  WHERE email IN ('admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com')
);

-- 3. Remover submissões de teste
DELETE FROM submissions
WHERE team_id IN (
  SELECT id FROM teams
  WHERE email IN ('admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com')
);

-- 4. Remover as equipes fake
DELETE FROM teams
WHERE email IN ('admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com');

-- 5. Resetar event_config para estado inicial
UPDATE event_config
SET
  current_phase = 0,
  event_started = false,
  event_ended = false,
  event_start_time = NULL,
  event_end_time = NULL,
  phase_1_start_time = NULL,
  phase_2_start_time = NULL,
  phase_3_start_time = NULL,
  phase_4_start_time = NULL,
  phase_5_start_time = NULL
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 6. Limpar penalidades antigas (se houver)
DELETE FROM penalties
WHERE created_at < NOW() - INTERVAL '1 day';

-- 7. Verificar estado final
SELECT 'Teams restantes:' as info;
SELECT id, name, email, course, members FROM teams ORDER BY created_at;

SELECT 'Event config state:' as info;
SELECT current_phase, event_started, event_ended, event_start_time FROM event_config;

SELECT 'Total penalties:' as info;
SELECT COUNT(*) FROM penalties;

SELECT 'Total submissions:' as info;
SELECT COUNT(*) FROM submissions;
