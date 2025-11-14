-- ==========================================
-- FIX IMEDIATO: Corrigir submissão avaliada sem penalty
-- ==========================================

-- PASSO 1: Encontrar a submissão que foi avaliada com 100 pontos (sem penalty)
-- Esta deve ser a mais recente avaliação onde final_points = 100
WITH target_submission AS (
  SELECT
    s.id,
    s.team_id,
    t.name as team_name,
    s.quest_id,
    q.name as quest_name,
    s.final_points,
    s.is_late,
    s.late_penalty_applied,
    s.submitted_at
  FROM submissions s
  LEFT JOIN teams t ON s.team_id = t.id
  LEFT JOIN quests q ON s.quest_id = q.id
  WHERE s.status = 'evaluated'
  AND s.final_points = 100  -- Esta é a que foi salva SEM penalty
  ORDER BY s.submitted_at DESC
  LIMIT 1
)
SELECT 'ANTES DO FIX' as stage, * FROM target_submission;

-- PASSO 2: Atualizar a submissão para marcar como atrasada e aplicar -5 penalty
UPDATE submissions
SET
  is_late = TRUE,
  late_minutes = 5,
  late_penalty_applied = 5,
  final_points = final_points - 5  -- 100 - 5 = 95
WHERE id IN (
  SELECT s.id
  FROM submissions s
  WHERE s.status = 'evaluated'
  AND s.final_points = 100  -- Encontrar a submissão que foi salva com 100
  AND s.is_late = FALSE  -- Que NÃO está marcada como atrasada ainda
  ORDER BY s.submitted_at DESC
  LIMIT 1
);

-- PASSO 3: Verificar o resultado depois do fix
WITH fixed_submission AS (
  SELECT
    s.id,
    s.team_id,
    t.name as team_name,
    s.quest_id,
    q.name as quest_name,
    s.final_points,
    s.is_late,
    s.late_penalty_applied,
    s.submitted_at,
    s.status
  FROM submissions s
  LEFT JOIN teams t ON s.team_id = t.id
  LEFT JOIN quests q ON s.quest_id = q.id
  WHERE s.status = 'evaluated'
  AND s.final_points = 95  -- Agora deveria ter 95
  ORDER BY s.submitted_at DESC
  LIMIT 1
)
SELECT 'DEPOIS DO FIX' as stage, * FROM fixed_submission;

-- PASSO 4: Verificar o score atualizado na live_ranking
SELECT
  'LIVE_RANKING' as check_point,
  team_name,
  total_points,
  quests_completed
FROM live_ranking
WHERE total_points LIKE '%team_name%'
LIMIT 5;
