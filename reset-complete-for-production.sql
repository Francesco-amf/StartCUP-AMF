-- ==========================================
-- RESET COMPLETO PARA PRODUÇÃO (15 EQUIPES)
-- ==========================================
-- DELETA TUDO e retorna o sistema ao estado inicial

-- 1. Deletar TODAS as penalidades
DELETE FROM penalties;

-- 2. Deletar TODAS as avaliações
DELETE FROM evaluations;

-- 3. Deletar TODAS as submissões
DELETE FROM submissions;

-- 4. Deletar TODAS as ativações de power-ups
DELETE FROM power_ups;

-- 5. Remover equipes de TESTE (admin, avaliadores)
DELETE FROM teams
WHERE email IN ('admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com');

-- 6. Resetar event_config completamente
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

-- 7. Garantir que live_ranking view está correta (com desconto de penalidades)
DROP VIEW IF EXISTS live_ranking CASCADE;

CREATE VIEW live_ranking AS
SELECT
  t.id as team_id,
  t.name as team_name,
  t.course,
  COALESCE(SUM(s.final_points), 0) - COALESCE(SUM(p.points_deduction), 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.status = 'evaluated' THEN s.id END) as quests_completed,
  0 as power_ups_used
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN penalties p ON t.id = p.team_id
WHERE t.email NOT IN ('admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com')
GROUP BY t.id, t.name, t.course
ORDER BY total_points DESC;

GRANT SELECT ON live_ranking TO anon;
GRANT SELECT ON live_ranking TO authenticated;

-- 8. Verificar estado final
SELECT '=== SISTEMA RESETADO ===' as status;
SELECT 'Teams restantes:' as info;
SELECT id, name, email, course FROM teams ORDER BY created_at;

SELECT '' as blank;
SELECT 'Event config:' as info;
SELECT current_phase, event_started, event_ended FROM event_config;

SELECT '' as blank;
SELECT 'Penalidades restantes:' as info;
SELECT COUNT(*) as total FROM penalties;

SELECT '' as blank;
SELECT 'Submissões restantes:' as info;
SELECT COUNT(*) as total FROM submissions;

SELECT '' as blank;
SELECT 'Avaliações restantes:' as info;
SELECT COUNT(*) as total FROM evaluations;

SELECT '' as blank;
SELECT 'Live Ranking (test):' as info;
SELECT team_id, team_name, course, total_points FROM live_ranking LIMIT 5;
