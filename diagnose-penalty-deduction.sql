-- ========================================
-- DIAGNÓSTICO: PENALIDADES NÃO DEDUZIDAS
-- ========================================

-- 1. Verificar se a view live_ranking existe e como está definida
SELECT
  table_name,
  view_definition
FROM information_schema.views
WHERE table_name = 'live_ranking';

-- 2. Verificar submissões com atraso que deveria ter penalidade
SELECT
  t.name as team_name,
  q.name as quest_name,
  s.submitted_at,
  s.is_late,
  s.late_penalty_applied,
  s.final_points as points_received,
  p.points_deduction as penalty_amount,
  (s.final_points - COALESCE(p.points_deduction, 0)) as should_be_total
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
LEFT JOIN penalties p ON s.team_id = p.team_id AND p.penalty_type = 'atraso'
WHERE s.is_late = TRUE
ORDER BY s.submitted_at DESC;

-- 3. Verificar dados do ranking ao vivo
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
ORDER BY total_points DESC
LIMIT 10;

-- 4. Verificar schema da tabela submissions
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'submissions'
ORDER BY ordinal_position;

-- 5. Verificar schema da tabela penalties
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'penalties'
ORDER BY ordinal_position;

-- 6. Contar submissões com atraso
SELECT
  COUNT(*) as total_late_submissions,
  COUNT(CASE WHEN late_penalty_applied > 0 THEN 1 END) as with_penalty_recorded,
  COUNT(CASE WHEN late_penalty_applied IS NULL THEN 1 END) as without_penalty_recorded
FROM submissions
WHERE is_late = TRUE;

-- 7. Verificar se penalties estão sendo criadas
SELECT
  t.name as team_name,
  COUNT(*) as penalty_count,
  SUM(p.points_deduction) as total_deductions
FROM penalties p
JOIN teams t ON p.team_id = t.id
WHERE p.penalty_type = 'atraso'
GROUP BY t.id, t.name
ORDER BY total_deductions DESC;

-- 8. Verificar quais equipes têm submissões com atraso MAS sem penalidades registradas
SELECT
  t.name as team_name,
  COUNT(s.id) as late_submissions,
  COUNT(DISTINCT p.id) as penalties_recorded
FROM submissions s
JOIN teams t ON s.team_id = t.id
LEFT JOIN penalties p ON s.team_id = p.team_id AND p.penalty_type = 'atraso'
WHERE s.is_late = TRUE
GROUP BY t.id, t.name
HAVING COUNT(DISTINCT p.id) = 0
ORDER BY COUNT(s.id) DESC;

-- 9. Testar cálculo manual para um time específico
-- Substitua 'Áurea Forma' pelo nome correto se diferente
SELECT
  t.id as team_id,
  t.name as team_name,
  SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END) as evaluated_points,
  COALESCE(SUM(CASE WHEN p.penalty_type = 'atraso' THEN p.points_deduction ELSE 0 END), 0) as penalties_total,
  SUM(CASE WHEN s.status = 'evaluated' THEN s.final_points ELSE 0 END) -
    COALESCE(SUM(CASE WHEN p.penalty_type = 'atraso' THEN p.points_deduction ELSE 0 END), 0) as final_score_should_be
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN penalties p ON t.id = p.team_id
WHERE LOWER(t.name) LIKE '%aurea%' OR LOWER(t.name) LIKE '%forma%'
GROUP BY t.id, t.name;
