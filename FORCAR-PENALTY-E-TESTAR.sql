-- ==========================================
-- FORÇAR PENALTY DE -5 E TESTAR
-- ==========================================

-- Atualizar a submissão para ter -5 de penalty
UPDATE submissions
SET
  is_late = TRUE,
  late_minutes = 5,
  late_penalty_applied = 5,
  final_points = final_points - 5  -- Se foi 100, agora fica 95
WHERE id = '503f9b1d-28ba-4167-a2f7-0d806eafc2b3';

-- Verificar resultado
SELECT
  id,
  is_late,
  late_penalty_applied,
  final_points,
  status
FROM submissions
WHERE id = '503f9b1d-28ba-4167-a2f7-0d806eafc2b3';

-- Verificar na live_ranking
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
WHERE team_name ILIKE '%aurea%';
