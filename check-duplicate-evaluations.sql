-- Verificar se há avaliações duplicadas (mesma submission + evaluator)
SELECT
  submission_id,
  evaluator_id,
  COUNT(*) as evaluation_count,
  STRING_AGG(id::text, ', ') as evaluation_ids
FROM evaluations
GROUP BY submission_id, evaluator_id
HAVING COUNT(*) > 1;

-- Ver todas as avaliações com detalhes
SELECT
  e.id,
  e.submission_id,
  e.evaluator_id,
  e.points,
  e.base_points,
  e.bonus_points,
  e.multiplier,
  e.created_at,
  e.updated_at,
  ev.name as evaluator_name,
  ev.email as evaluator_email,
  s.id as submission_exists
FROM evaluations e
LEFT JOIN evaluators ev ON e.evaluator_id = ev.id
LEFT JOIN submissions s ON e.submission_id = s.id
ORDER BY e.submission_id, e.evaluator_id, e.created_at DESC;
