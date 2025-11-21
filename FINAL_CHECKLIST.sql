-- CHECKLIST FINAL PRÉ-EVENTO
-- Execute NO SUPABASE SQL EDITOR para validar TUDO

WITH checks AS (
  SELECT
    1 as check_order,
    'FUNÇÃO PROTEÇÃO' as category,
    'auto_start_next_quest() tem proteção?' as check_item,
    CASE 
      WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname='auto_start_next_quest' 
            AND prosrc LIKE '%order_index = 4%') > 0 
      THEN '✅ SIM'
      ELSE '❌ NÃO'
    END as status

  UNION ALL

  SELECT 2, 'FUNÇÃO PROTEÇÃO', 'Valida deliverable_type=presentation?',
    CASE 
      WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname='auto_start_next_quest'
            AND prosrc LIKE '%presentation%') > 0
      THEN '✅ SIM'
      ELSE '❌ NÃO'
    END

  UNION ALL

  SELECT 3, 'EVENT CONFIG', 'Phase está 0?',
    CASE WHEN (SELECT current_phase FROM event_config) = 0 THEN '✅ SIM' ELSE '❌ NÃO' END

  UNION ALL

  SELECT 4, 'EVENT CONFIG', 'event_started = false?',
    CASE WHEN (SELECT event_started FROM event_config) = false THEN '✅ SIM' ELSE '❌ NÃO' END

  UNION ALL

  SELECT 5, 'QUESTS', 'Todas em scheduled?',
    CASE 
      WHEN (SELECT COUNT(*) FROM quests WHERE status != 'scheduled') = 0 
      THEN '✅ SIM'
      ELSE '❌ NÃO - ' || (SELECT COUNT(*) FROM quests WHERE status != 'scheduled')::text || ' com outro status'
    END

  UNION ALL

  SELECT 6, 'QUESTS', 'Nenhuma com started_at?',
    CASE 
      WHEN (SELECT COUNT(*) FROM quests WHERE started_at IS NOT NULL) = 0
      THEN '✅ SIM'
      ELSE '❌ NÃO - ' || (SELECT COUNT(*) FROM quests WHERE started_at IS NOT NULL)::text || ' têm started_at'
    END

  UNION ALL

  SELECT 7, 'SUBMISSIONS', 'Todas zeradas?',
    CASE WHEN (SELECT COUNT(*) FROM submissions) = 0 THEN '✅ SIM' ELSE '❌ NÃO - ' || (SELECT COUNT(*) FROM submissions)::text || ' submissions' END

  UNION ALL

  SELECT 8, 'EVALUATIONS', 'Todas zeradas?',
    CASE WHEN (SELECT COUNT(*) FROM evaluations) = 0 THEN '✅ SIM' ELSE '❌ NÃO - ' || (SELECT COUNT(*) FROM evaluations)::text || ' evaluations' END

  UNION ALL

  SELECT 9, 'BOSS BATTLES', 'Nenhuma orphan?',
    CASE WHEN (SELECT COUNT(*) FROM boss_battles) = 0 THEN '✅ SIM' ELSE '❌ NÃO - ' || (SELECT COUNT(*) FROM boss_battles)::text || ' orphans' END

  UNION ALL

  SELECT 10, 'ESTRUCTURA', 'Phase 1 tem 4 quests?',
    CASE 
      WHEN (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id=p.id WHERE p.order_index=1) = 4
      THEN '✅ SIM'
      ELSE '❌ NÃO'
    END

  UNION ALL

  SELECT 11, 'ESTRUCTURA', 'Phase 1 Quest 4 é boss?',
    CASE 
      WHEN (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id=p.id 
            WHERE p.order_index=1 AND q.order_index=4 AND q.deliverable_type LIKE '%presentation%') > 0
      THEN '✅ SIM'
      ELSE '❌ NÃO'
    END

  UNION ALL

  SELECT 12, 'ESTRUCTURA', 'Todas 5 phases existem?',
    CASE 
      WHEN (SELECT COUNT(*) FROM phases) = 5
      THEN '✅ SIM'
      ELSE '❌ NÃO - Tem ' || (SELECT COUNT(*) FROM phases)::text || ' phases'
    END

  UNION ALL

  SELECT 13, 'EVALUATORS', 'Evaluators têm role="evaluator"?',
    CASE 
      WHEN (SELECT COUNT(*) FROM auth.users WHERE (raw_user_meta_data->>'role') = 'evaluator') > 10
      THEN '✅ SIM - ' || (SELECT COUNT(*) FROM auth.users WHERE (raw_user_meta_data->>'role') = 'evaluator')::text || ' encontrados'
      ELSE '❌ NÃO'
    END

  UNION ALL

  SELECT 14, 'CRON', 'Job auto-start-next-quest existe?',
    CASE 
      WHEN (SELECT COUNT(*) FROM cron.job WHERE jobname = 'auto-start-next-quest-job') > 0
      THEN '✅ SIM'
      ELSE '❌ NÃO'
    END

  UNION ALL

  SELECT 15, 'FINAL', 'TUDO OK?',
    CASE 
      WHEN (SELECT COUNT(*) FROM checks WHERE status LIKE '❌%') = 0
      THEN '🟢 PRONTO PARA EVENTO!'
      ELSE '🔴 REVISAR ACIMA'
    END
)
SELECT check_order, category, check_item, status
FROM checks
ORDER BY check_order;
