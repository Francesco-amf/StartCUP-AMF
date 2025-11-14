-- ==========================================
-- CORRIGIR SUBMISSÃO DE 50 PARA 45 AGORA
-- ==========================================

-- Se a submissão é atrasada mas tem penalty = 0
-- Vamos forçar -5 de penalty

UPDATE submissions
SET
  late_penalty_applied = 5,
  final_points = final_points - 5  -- 50 → 45
WHERE id = 'a4824d8f-606a-42e3-a831-a3e01124fdbe'
AND is_late = TRUE
AND late_penalty_applied = 0;

-- Verificar resultado
SELECT
  id,
  is_late,
  late_penalty_applied,
  final_points,
  status
FROM submissions
WHERE id = 'a4824d8f-606a-42e3-a831-a3e01124fdbe';

-- Verificar live_ranking
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
WHERE team_name ILIKE '%aurea%';
