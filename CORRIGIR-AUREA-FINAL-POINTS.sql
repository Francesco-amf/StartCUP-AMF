-- ========================================
-- CORRIGIR final_points DE ÁUREA FORMA
-- ========================================

-- PASSO 1: Ver as submissões antes
SELECT
  'ANTES' as status,
  s.id,
  s.team_id,
  s.final_points,
  s.is_late,
  s.late_penalty_applied,
  (s.final_points - COALESCE(s.late_penalty_applied, 0)) as final_points_correto
FROM submissions s
WHERE s.team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%')
AND s.status = 'evaluated'
AND s.is_late = TRUE
AND s.late_penalty_applied > 0;

-- PASSO 2: Atualizar final_points (subtrair a penalidade)
UPDATE submissions
SET final_points = final_points - late_penalty_applied
WHERE team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%')
AND status = 'evaluated'
AND is_late = TRUE
AND late_penalty_applied > 0;

-- PASSO 3: Ver as submissões depois
SELECT
  'DEPOIS' as status,
  s.id,
  s.team_id,
  s.final_points,
  s.is_late,
  s.late_penalty_applied
FROM submissions s
WHERE s.team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%')
AND s.status = 'evaluated'
AND s.is_late = TRUE
AND s.late_penalty_applied > 0;

-- PASSO 4: Ver score no live_ranking
SELECT
  'LIVE_RANKING' as status,
  team_name,
  total_points,
  quests_completed
FROM live_ranking
WHERE team_name ILIKE '%aurea%';
