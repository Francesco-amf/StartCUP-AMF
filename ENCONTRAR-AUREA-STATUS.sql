-- ========================================
-- ENCONTRAR EXATAMENTE COMO ESTÃO OS DADOS
-- ========================================

-- 1. Qual é o ID de Áurea Forma?
SELECT id, name, course FROM teams WHERE name ILIKE '%aurea%';

-- 2. Submissões dela (VER TODOS OS CAMPOS)
SELECT
  s.id,
  s.team_id,
  s.quest_id,
  s.status,  -- ← Qual é o status?
  s.final_points,
  s.submitted_at,
  s.is_late,
  s.late_penalty_applied,
  q.name as quest_name
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.team_id = (SELECT id FROM teams WHERE name ILIKE '%aurea%')
LIMIT 20;

-- 3. Quantas submissões cada status tem?
SELECT
  s.status,
  COUNT(*) as quantidade
FROM submissions s
WHERE s.team_id = (SELECT id FROM teams WHERE name ILIKE '%aurea%')
GROUP BY s.status;

-- 4. Ver todas as equipes no live_ranking
SELECT
  team_name,
  total_points,
  quests_completed
FROM live_ranking
LIMIT 10;

-- 5. Ver quantos times aparecem no live_ranking
SELECT COUNT(*) as teams_no_ranking FROM live_ranking;

-- 6. Ver total de submissões avaliadas no banco todo
SELECT
  COUNT(*) as total_subs_evaluated
FROM submissions
WHERE status = 'evaluated';

-- 7. Ver todos os status possíveis
SELECT DISTINCT status FROM submissions;
