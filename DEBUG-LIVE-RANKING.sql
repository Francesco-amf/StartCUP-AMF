-- ========================================
-- DEBUG: Verificar live_ranking
-- ========================================

-- 1. View existe?
SELECT EXISTS(
  SELECT 1 FROM information_schema.views
  WHERE table_name = 'live_ranking'
  AND table_schema = 'public'
) as view_exists;

-- 2. Ver definição da view
SELECT view_definition FROM information_schema.views
WHERE table_name = 'live_ranking' AND table_schema = 'public';

-- 3. Tentar SELECT da view
SELECT * FROM live_ranking LIMIT 5;

-- 4. Se a view não existir, ver estrutura das tabelas
SELECT
  'teams' as table_name,
  COUNT(*) as row_count
FROM teams

UNION ALL

SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL
SELECT 'quests', COUNT(*) FROM quests
UNION ALL
SELECT 'phases', COUNT(*) FROM phases
UNION ALL
SELECT 'penalties', COUNT(*) FROM penalties
UNION ALL
SELECT 'evaluations', COUNT(*) FROM evaluations;

-- 5. Ver Áurea Forma
SELECT id, name, course FROM teams WHERE name ILIKE '%aurea%';

-- 6. Ver submissões de Áurea Forma
SELECT
  s.id,
  s.quest_id,
  s.final_points,
  s.status,
  s.submitted_at,
  q.name
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
LEFT JOIN teams t ON s.team_id = t.id
WHERE t.name ILIKE '%aurea%';

-- 7. Verificar se há evaluations
SELECT
  e.id,
  e.submission_id,
  e.awarded_points,
  e.status
FROM evaluations e
LIMIT 5;
