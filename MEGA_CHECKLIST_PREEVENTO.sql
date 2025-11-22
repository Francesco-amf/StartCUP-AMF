-- MEGA CHECKLIST PRÉ-EVENTO - TUDO QUE PODE DAR ERRADO
-- Execute TUDO isto no Supabase SQL Editor antes de começar

-- ========================================================
-- 1. SISTEMA CORE
-- ========================================================

WITH system_checks AS (
  SELECT 'EVENTO CONFIG' as cat, 'Phase = 0?' as check_name,
    CASE WHEN (SELECT current_phase FROM event_config) = 0 THEN '✅' ELSE '❌' END as status,
    (SELECT current_phase::text FROM event_config) as detail
  UNION ALL
  SELECT 'EVENTO CONFIG', 'event_started = false?',
    CASE WHEN (SELECT event_started FROM event_config) = false THEN '✅' ELSE '❌' END,
    (SELECT event_started::text FROM event_config)
  UNION ALL
  SELECT 'EVENTO CONFIG', 'event_end_time configurada?',
    CASE WHEN (SELECT event_end_time FROM event_config) IS NOT NULL THEN '✅' ELSE '❌' END,
    (SELECT event_end_time::text FROM event_config)

-- ========================================================
-- 2. ESTRUTURA DE QUESTS
-- ========================================================
  UNION ALL
  SELECT 'QUESTS', 'Total de quests = 19?',
    CASE WHEN (SELECT COUNT(*) FROM quests) = 19 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM quests)
  UNION ALL
  SELECT 'QUESTS', 'Todas em status scheduled?',
    CASE WHEN (SELECT COUNT(*) FROM quests WHERE status != 'scheduled') = 0 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM quests WHERE status != 'scheduled')
  UNION ALL
  SELECT 'QUESTS', 'Nenhuma tem started_at (exceto ativas)?',
    CASE WHEN (SELECT COUNT(*) FROM quests WHERE started_at IS NOT NULL) <= 1 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM quests WHERE started_at IS NOT NULL)
  UNION ALL
  SELECT 'QUESTS', 'Todas têm duration_minutes?',
    CASE WHEN (SELECT COUNT(*) FROM quests WHERE duration_minutes IS NULL) = 0 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM quests WHERE duration_minutes IS NULL)

-- ========================================================
-- 3. BOSSES (CRÍTICO!)
-- ========================================================
  UNION ALL
  SELECT 'BOSSES', 'Phase 1-4 têm boss (order_index=4)?',
    CASE WHEN (SELECT COUNT(*) FROM quests q 
              JOIN phases p ON q.phase_id=p.id 
              WHERE p.order_index IN (1,2,3,4) AND q.order_index=4) = 4 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM quests q 
     JOIN phases p ON q.phase_id=p.id 
     WHERE p.order_index IN (1,2,3,4) AND q.order_index=4)
  UNION ALL
  SELECT 'BOSSES', 'Phase 5 NÃO tem boss?',
    CASE WHEN (SELECT COUNT(*) FROM quests q 
              JOIN phases p ON q.phase_id=p.id 
              WHERE p.order_index=5 AND q.order_index=4) = 0 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM quests q 
     JOIN phases p ON q.phase_id=p.id 
     WHERE p.order_index=5 AND q.order_index=4)
  UNION ALL
  SELECT 'BOSSES', 'Bosses têm deliverable_type=presentation?',
    CASE WHEN (SELECT COUNT(*) FROM quests WHERE order_index=4 AND deliverable_type LIKE '%presentation%') >= 4 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM quests WHERE order_index=4 AND deliverable_type LIKE '%presentation%')
  UNION ALL
  SELECT 'BOSSES', 'Proteção boss no auto_start_next_quest()?',
    CASE WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname='auto_start_next_quest' 
              AND prosrc LIKE '%order_index = 4%') > 0 THEN '✅' ELSE '❌' END,
    'Check function code'
  UNION ALL
  SELECT 'BOSSES', 'Proteção presentation no auto_start_next_quest()?',
    CASE WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname='auto_start_next_quest' 
              AND prosrc LIKE '%presentation%') > 0 THEN '✅' ELSE '❌' END,
    'Check function code'

-- ========================================================
-- 4. DADOS LIMPOS (NENHUM LIXO)
-- ========================================================
  UNION ALL
  SELECT 'LIMPEZA', 'Submissions zeradas?',
    CASE WHEN (SELECT COUNT(*) FROM submissions) = 0 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM submissions)
  UNION ALL
  SELECT 'LIMPEZA', 'Evaluations zeradas?',
    CASE WHEN (SELECT COUNT(*) FROM evaluations) = 0 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM evaluations)
  UNION ALL
  SELECT 'LIMPEZA', 'Boss Battles zeradas?',
    CASE WHEN (SELECT COUNT(*) FROM boss_battles) = 0 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM boss_battles)

-- ========================================================
-- 5. TEAMS E MEMBROS
-- ========================================================
  UNION ALL
  SELECT 'TEAMS', 'Teams > 0?',
    CASE WHEN (SELECT COUNT(*) FROM teams) > 0 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM teams)

-- ========================================================
-- 6. EVALUATORS
-- ========================================================
  UNION ALL
  SELECT 'EVALUATORS', 'Evaluators > 10?',
    CASE WHEN (SELECT COUNT(*) FROM auth.users WHERE (raw_user_meta_data->>'role') = 'evaluator') > 10 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM auth.users WHERE (raw_user_meta_data->>'role') = 'evaluator')
  UNION ALL
  SELECT 'EVALUATORS', 'Nenhum evaluator com email vazio?',
    CASE WHEN (SELECT COUNT(*) FROM auth.users 
              WHERE (raw_user_meta_data->>'role') = 'evaluator' AND email IS NULL) = 0 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM auth.users 
     WHERE (raw_user_meta_data->>'role') = 'evaluator' AND email IS NULL)

-- ========================================================
-- 7. FASES
-- ========================================================
  UNION ALL
  SELECT 'PHASES', 'Total phases = 5?',
    CASE WHEN (SELECT COUNT(*) FROM phases) = 5 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM phases)
  UNION ALL
  SELECT 'PHASES', 'Cada phase tem 3-4 quests?',
    CASE WHEN (SELECT COUNT(DISTINCT p.id) FROM phases p 
              WHERE (SELECT COUNT(*) FROM quests q WHERE q.phase_id = p.id) BETWEEN 3 AND 4) = 5 THEN '✅' ELSE '❌' END,
    'All phases OK'
  UNION ALL
  SELECT 'PHASES', 'Fases têm order_index 1-5?',
    CASE WHEN (SELECT COUNT(*) FROM phases WHERE order_index BETWEEN 1 AND 5) = 5 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM phases WHERE order_index BETWEEN 1 AND 5)

-- ========================================================
-- 8. CRON JOBS
-- ========================================================
  UNION ALL
  SELECT 'CRON', 'auto-start-next-quest-job existe?',
    CASE WHEN (SELECT COUNT(*) FROM cron.job WHERE jobname = 'auto-start-next-quest-job') > 0 THEN '✅' ELSE '❌' END,
    'CRON active'
  UNION ALL
  SELECT 'CRON', 'auto-start-next-quest-job está ATIVO?',
    CASE WHEN (SELECT COUNT(*) FROM cron.job 
              WHERE jobname = 'auto-start-next-quest-job' AND active = true) > 0 THEN '✅' ELSE '❌' END,
    'Check status'

-- ========================================================
-- 9. TIMEZONES (PARANOIA)
-- ========================================================
  UNION ALL
  SELECT 'TIMEZONE', 'NOW() retorna UTC?',
    CASE WHEN timezone(NOW())::text = '00:00:00' THEN '✅' ELSE '⚠️' END,
    timezone(NOW())::text

-- ========================================================
-- 10. EDGE CASES BIZARROS
-- ========================================================
  UNION ALL
  SELECT 'EDGE CASES', 'Nenhuma quest com NULL em mandatory fields?',
    CASE WHEN (SELECT COUNT(*) FROM quests WHERE name IS NULL OR phase_id IS NULL OR duration_minutes IS NULL) = 0 THEN '✅' ELSE '❌' END,
    (SELECT COUNT(*)::text FROM quests WHERE name IS NULL OR phase_id IS NULL)
)

SELECT cat as "CATEGORIA", check_name as "CHECK", status as "STATUS", detail as "DETALHE"
FROM system_checks
ORDER BY 
  CASE cat 
    WHEN 'EVENTO CONFIG' THEN 1
    WHEN 'QUESTS' THEN 2
    WHEN 'BOSSES' THEN 3
    WHEN 'LIMPEZA' THEN 4
    WHEN 'TEAMS' THEN 5
    WHEN 'EVALUATORS' THEN 6
    WHEN 'PHASES' THEN 7
    WHEN 'CRON' THEN 8
    WHEN 'TIMEZONE' THEN 9
    WHEN 'EDGE CASES' THEN 10
  END;
