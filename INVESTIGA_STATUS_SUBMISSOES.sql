-- ============================================================================
-- INVESTIGAÇÃO: Quais são os status reais das submissões?
-- ============================================================================

-- 1. DISTRIBUIÇÃO DE STATUS (últimas 72 horas)
SELECT 
  s.status,
  COUNT(*) as total,
  ROUND(((COUNT(*)::FLOAT / (SELECT COUNT(*) FROM submissions WHERE submitted_at > NOW() - INTERVAL '72 hours')) * 100)::NUMERIC, 2)::TEXT || '%' as percentual
FROM submissions s
WHERE s.submitted_at > NOW() - INTERVAL '72 hours'
GROUP BY s.status
ORDER BY total DESC;

-- 2. AMOSTRA DE SUBMISSÕES COM TODOS OS DETALHES
SELECT 
  t.name as team_name,
  q.name as quest_name,
  s.id,
  s.status,
  s.submitted_at,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  s.file_url
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
WHERE s.submitted_at > NOW() - INTERVAL '72 hours'
ORDER BY s.submitted_at DESC
LIMIT 20;

-- 3. QUEST 1.2 ESPECIFICAMENTE
SELECT 
  t.name as team_name,
  s.id,
  s.status,
  s.submitted_at,
  s.is_late,
  s.late_penalty_applied,
  q.name as quest_name,
  q.started_at,
  q.planned_deadline_minutes
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
WHERE q.name = 'Quest 1.2'
ORDER BY s.submitted_at DESC;
