-- ==========================================
-- TESTE RÁPIDO: Verificar se penalidade funciona
-- ==========================================

-- PASSO 1: Ver última submissão que vai ser avaliada
SELECT
  s.id as submission_id,
  s.team_id,
  t.name as team_name,
  s.quest_id,
  q.name as quest_name,
  s.status,
  s.submitted_at,
  s.is_late,
  s.late_penalty_applied
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.status = 'pending'
ORDER BY s.submitted_at DESC
LIMIT 1;

-- PASSO 2: COPIE O ID DA SUBMISSÃO ACIMA E EXECUTE ISTO:
-- (Descomente e substitua SUBMISSION_ID_AQUI)

/*
UPDATE submissions
SET
  is_late = TRUE,
  late_minutes = 5,
  late_penalty_applied = 5
WHERE id = 'SUBMISSION_ID_AQUI';

-- Verificar que foi marcada
SELECT id, is_late, late_penalty_applied FROM submissions WHERE id = 'SUBMISSION_ID_AQUI';
*/

-- PASSO 3: AVALIE no site com 100 pontos
-- Expected: final_points = 95 (100 - 5)

-- PASSO 4: Verifique o resultado DEPOIS de avaliar
/*
SELECT
  s.id,
  s.final_points,
  s.is_late,
  s.late_penalty_applied,
  s.status,
  t.name
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE s.status = 'evaluated'
AND s.is_late = TRUE
ORDER BY s.submitted_at DESC
LIMIT 1;
*/
