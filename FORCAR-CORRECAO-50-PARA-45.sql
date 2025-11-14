-- ==========================================
-- FORÇAR CORREÇÃO: 50 → 45
-- ==========================================

-- PASSO 1: Encontrar qual submissão é
SELECT
  s.id,
  s.final_points,
  s.is_late,
  s.late_penalty_applied,
  t.name as team_name
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE s.status = 'evaluated'
AND s.final_points = 50
ORDER BY s.submitted_at DESC
LIMIT 1;

-- PASSO 2: Se a submissão anterior é atrasada, forçar:
-- (Descomente e execute)

/*
UPDATE submissions
SET
  final_points = 45  -- 50 - 5 de penalty
WHERE id = 'COLOQUE_ID_AQUI'
AND status = 'evaluated'
AND is_late = TRUE;

-- Verificar
SELECT final_points, is_late, late_penalty_applied FROM submissions WHERE id = 'COLOQUE_ID_AQUI';
*/

-- PASSO 3: Verificar live_ranking depois
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
ORDER BY total_points DESC
LIMIT 10;
