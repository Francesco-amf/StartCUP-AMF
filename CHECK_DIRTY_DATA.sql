-- Verificar se tem dados sujos/antigos do evento
-- Execute no Supabase SQL Editor

WITH event_status AS (
  SELECT 
    'Phase: ' || current_phase || ' | Started: ' || event_started as status
  FROM event_config
  LIMIT 1
),
quests_active AS (
  SELECT COUNT(*) as count FROM quests WHERE status = 'active'
),
submissions_count AS (
  SELECT COUNT(*) as count FROM submissions
),
evaluations_count AS (
  SELECT COUNT(*) as count FROM evaluations
),
boss_battles_count AS (
  SELECT COUNT(*) as count FROM boss_battles
),
old_quests AS (
  SELECT COUNT(*) as count FROM quests
  WHERE started_at IS NOT NULL 
    AND NOW() - started_at > INTERVAL '1 hour'
),
old_submissions AS (
  SELECT COUNT(*) as count FROM submissions
  WHERE submitted_at IS NOT NULL
    AND NOW() - submitted_at > INTERVAL '1 hour'
)
SELECT 'EVENT CONFIG' as "Section", 'Status' as "Item", status as "Info"
FROM event_status

UNION ALL

SELECT 'QUESTS', 'Ativas agora', count::text
FROM quests_active

UNION ALL

SELECT 'SUBMISSIONS', 'Total', count::text
FROM submissions_count

UNION ALL

SELECT 'EVALUATIONS', 'Total', count::text
FROM evaluations_count

UNION ALL

SELECT 'BOSS BATTLES', 'Orphans', count::text
FROM boss_battles_count

UNION ALL

SELECT 'OLD DATA', 'Quests >1h antigo', count::text
FROM old_quests

UNION ALL

SELECT 'OLD DATA', 'Submissions >1h antigo', count::text
FROM old_submissions

UNION ALL

SELECT 'ANÁLISE FINAL', 'Status', 
  CASE 
    WHEN (SELECT count FROM submissions_count) = 0 
      AND (SELECT count FROM evaluations_count) = 0
      AND (SELECT count FROM boss_battles_count) = 0
      AND (SELECT count FROM old_quests) = 0
      AND (SELECT count FROM old_submissions) = 0
    THEN '✅ LIMPO - Sem dados sujos (Quest 1.1 ativa é normal)'
    ELSE '⚠️ TEM DADOS ANTIGOS'
  END
;
