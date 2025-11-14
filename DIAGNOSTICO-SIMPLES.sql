-- ========================================
-- DIAGNÓSTICO SIMPLES - Ver o que temos
-- ========================================

-- Quantas equipes existem?
SELECT COUNT(*) as total_teams FROM teams;

-- Quantas submissões existem?
SELECT COUNT(*) as total_submissions FROM submissions;

-- Quantas submissões têm is_late = TRUE?
SELECT COUNT(*) as late_submissions FROM submissions WHERE is_late = TRUE;

-- Quantas penalidades existem?
SELECT COUNT(*) as total_penalties FROM penalties;

-- Áurea Forma existe?
SELECT id, name, course FROM teams WHERE name ILIKE '%aurea%';

-- Submissões da Áurea Forma
SELECT
  s.id,
  s.quest_id,
  s.is_late,
  s.late_penalty_applied,
  s.submitted_at,
  q.name,
  q.started_at,
  q.planned_deadline_minutes
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%';

-- Score atual de Áurea Forma
SELECT team_name, total_points FROM live_ranking WHERE team_name ILIKE '%aurea%';
