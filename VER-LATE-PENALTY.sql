-- Ver EXATAMENTE o que tem em late_penalty_applied
SELECT
  s.id,
  s.final_points,
  s.is_late,
  s.late_penalty_applied,
  s.status,
  t.name
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%';

-- Ver quais têm late_penalty_applied > 0
SELECT
  'late_penalty > 0' as check_type,
  COUNT(*) as count
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%'
AND s.late_penalty_applied > 0;

-- Ver quais são is_late = TRUE
SELECT
  'is_late = TRUE' as check_type,
  COUNT(*) as count
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%'
AND s.is_late = TRUE;
