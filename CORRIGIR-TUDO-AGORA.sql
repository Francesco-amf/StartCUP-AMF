-- ========================================
-- CORRIGIR TUDO: Marcar atrasadas e subtrair pontos
-- ========================================

-- PASSO 1: Atualizar é_late E late_penalty_applied para Áurea Forma
-- Baseado em: submitted_at > (started_at + planned_deadline_minutes)
UPDATE submissions s
SET
  is_late = TRUE,
  late_minutes = EXTRACT(EPOCH FROM (s.submitted_at - (
    SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
    FROM quests q WHERE q.id = s.quest_id
  )))::INTEGER / 60,
  late_penalty_applied = CASE
    WHEN EXTRACT(EPOCH FROM (s.submitted_at - (
      SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
      FROM quests q WHERE q.id = s.quest_id
    )))::INTEGER / 60 <= 5 THEN 5
    WHEN EXTRACT(EPOCH FROM (s.submitted_at - (
      SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
      FROM quests q WHERE q.id = s.quest_id
    )))::INTEGER / 60 <= 10 THEN 10
    WHEN EXTRACT(EPOCH FROM (s.submitted_at - (
      SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
      FROM quests q WHERE q.id = s.quest_id
    )))::INTEGER / 60 <= 15 THEN 15
    ELSE 0
  END
WHERE s.team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%')
AND s.submitted_at > (
  SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
  FROM quests q WHERE q.id = s.quest_id
)
AND s.is_late = FALSE;

-- PASSO 2: Subtrair a penalidade do final_points
UPDATE submissions s
SET final_points = final_points - late_penalty_applied
WHERE s.team_id IN (SELECT id FROM teams WHERE name ILIKE '%aurea%')
AND s.is_late = TRUE
AND s.late_penalty_applied > 0;

-- PASSO 3: Ver o resultado
SELECT
  'RESULT' as status,
  s.id,
  s.final_points,
  s.is_late,
  s.late_penalty_applied,
  t.name
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%'
ORDER BY s.submitted_at DESC;

-- PASSO 4: Ver score final
SELECT
  'LIVE_RANKING' as check,
  team_name,
  total_points,
  quests_completed
FROM live_ranking
WHERE team_name ILIKE '%aurea%';
