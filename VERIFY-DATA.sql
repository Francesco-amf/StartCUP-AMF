-- ========================================
-- VERIFICAR DADOS NO BANCO
-- ========================================

-- 1. Ver submissões da Áurea Forma
SELECT
  'Submissões Áurea Forma' as check_type,
  s.id,
  s.quest_id,
  s.is_late,
  s.late_penalty_applied,
  s.submitted_at,
  q.name as quest_name,
  q.started_at,
  q.planned_deadline_minutes
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%'
ORDER BY s.created_at DESC
LIMIT 10;

-- 2. Ver quests que têm submissões da Áurea Forma
SELECT
  'Quests com subs Áurea' as check_type,
  q.id,
  q.name,
  q.started_at,
  q.planned_deadline_minutes,
  q.allow_late_submissions
FROM quests q
WHERE q.id IN (
  SELECT DISTINCT s.quest_id
  FROM submissions s
  LEFT JOIN teams t ON s.team_id = t.id
  WHERE t.name ILIKE '%aurea%'
)
ORDER BY q.created_at DESC;

-- 3. Ver ALL submissions que têm is_late = TRUE
SELECT
  'Todas late submissions' as check_type,
  COUNT(*) as total_late,
  COUNT(DISTINCT team_id) as teams_with_late
FROM submissions
WHERE is_late = TRUE;

-- 4. Ver penalties
SELECT
  'Penalties no banco' as check_type,
  COUNT(*) as total,
  COUNT(DISTINCT team_id) as teams
FROM penalties
WHERE penalty_type = 'atraso';

-- 5. Ver live_ranking para Áurea Forma
SELECT
  'Live ranking Áurea' as check_type,
  team_name,
  total_points,
  quests_completed,
  power_ups_used
FROM live_ranking
WHERE team_name ILIKE '%aurea%';
