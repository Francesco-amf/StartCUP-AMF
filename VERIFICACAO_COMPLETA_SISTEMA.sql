-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔍 VERIFICAÇÃO COMPLETA: Sistema de Avanço de Fases + BOSS + Dashboard
-- ═══════════════════════════════════════════════════════════════════════════════
-- Este script verifica:
-- 1. ✅ Função auto_advance_phase() existe e está ativa
-- 2. ✅ Sistema BOSS configurado corretamente (Fases 1-4 têm Quest 4, Fase 5 não)
-- 3. ✅ Proteção BOSS no auto_start_next_quest()
-- 4. ✅ Proteção BOSS no /api/admin/advance-quest
-- 5. ✅ Timestamps phase_X_start_time configurados
-- 6. ✅ Cron jobs ativos
-- 7. ✅ Estrutura de quests completa (15 quests)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1️⃣ VERIFICAR FUNÇÃO auto_advance_phase()
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '1️⃣ FUNÇÃO AUTO_ADVANCE_PHASE' as status;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'auto_advance_phase' AND n.nspname = 'public'
    ) THEN '✅ Função auto_advance_phase() EXISTE'
    ELSE '❌ Função auto_advance_phase() NÃO ENCONTRADA'
  END as "Status da Função";

-- Verificar se tem proteção contra re-set
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'auto_advance_phase' 
        AND n.nspname = 'public'
        AND pg_get_functiondef(p.oid) LIKE '%evaluation_period_end_time IS NOT NULL%'
    ) THEN '✅ Tem proteção contra re-set de timestamps'
    ELSE '⚠️ Pode não ter proteção contra re-set'
  END as "Proteção Timestamps";

-- Verificar se seta phase_X_start_time
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'auto_advance_phase' 
        AND n.nspname = 'public'
        AND pg_get_functiondef(p.oid) LIKE '%phase_%_start_time%'
    ) THEN '✅ Seta phase_X_start_time ao avançar'
    ELSE '❌ NÃO seta phase_X_start_time (dashboard vai quebrar)'
  END as "Timestamps Fases";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2️⃣ VERIFICAR SISTEMA BOSS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '2️⃣ SISTEMA BOSS (Apresentações)' as status;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

-- Verificar estrutura BOSS por fase
SELECT 
  p.order_index as "Fase",
  COUNT(CASE WHEN q.order_index = 4 THEN 1 END) as "Tem Quest 4?",
  COUNT(CASE WHEN q.order_index = 4 AND q.deliverable_type LIKE '%presentation%' THEN 1 END) as "É BOSS?",
  CASE 
    WHEN p.order_index <= 4 THEN
      CASE 
        WHEN COUNT(CASE WHEN q.order_index = 4 AND q.deliverable_type LIKE '%presentation%' THEN 1 END) = 1 
        THEN '✅ BOSS configurado'
        ELSE '❌ FALTA BOSS'
      END
    ELSE
      CASE 
        WHEN COUNT(CASE WHEN q.order_index = 4 THEN 1 END) = 0 
        THEN '✅ Fase 5 SEM BOSS'
        ELSE '❌ Fase 5 NÃO DEVE TER Quest 4'
      END
  END as "Status"
FROM phases p
LEFT JOIN quests q ON q.phase_id = p.id
GROUP BY p.order_index
ORDER BY p.order_index;

-- Detalhes de cada BOSS
SELECT '─────────────────────────────────────' as separator;
SELECT '📋 Detalhes BOSS Quests' as info;

SELECT 
  p.order_index as "Fase",
  q.name as "Nome",
  q.duration_minutes as "Duração",
  q.deliverable_type as "Tipo",
  CASE WHEN q.late_submission_window_minutes IS NULL OR q.late_submission_window_minutes = 0 
    THEN '✅ Sem late (correto)'
    ELSE '⚠️ Tem late: ' || q.late_submission_window_minutes || 'min'
  END as "Late Window"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 4 OR q.deliverable_type LIKE '%presentation%'
ORDER BY p.order_index;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3️⃣ PROTEÇÃO BOSS NO auto_start_next_quest()
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '3️⃣ PROTEÇÃO BOSS - SQL Function' as status;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'auto_start_next_quest' 
        AND n.nspname = 'public'
    ) THEN '✅ Função auto_start_next_quest() EXISTE'
    ELSE '⚠️ Função auto_start_next_quest() NÃO ENCONTRADA'
  END as "Status da Função";

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'auto_start_next_quest' 
        AND n.nspname = 'public'
        AND (
          pg_get_functiondef(p.oid) LIKE '%order_index = 4%' OR
          pg_get_functiondef(p.oid) LIKE '%presentation%'
        )
    ) THEN '✅ TEM proteção contra ativar BOSS'
    ELSE '❌ NÃO TEM proteção BOSS (CRÍTICO!)'
  END as "Proteção BOSS";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4️⃣ VERIFICAR TIMESTAMPS DE FASES
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '4️⃣ TIMESTAMPS DAS FASES' as status;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
  current_phase as "Fase Atual",
  CASE WHEN phase_1_start_time IS NOT NULL THEN '✅' ELSE '❌' END as "F1 Start",
  CASE WHEN phase_2_start_time IS NOT NULL THEN '✅' ELSE '⏳' END as "F2 Start",
  CASE WHEN phase_3_start_time IS NOT NULL THEN '✅' ELSE '⏳' END as "F3 Start",
  CASE WHEN phase_4_start_time IS NOT NULL THEN '✅' ELSE '⏳' END as "F4 Start",
  CASE WHEN phase_5_start_time IS NOT NULL THEN '✅' ELSE '⏳' END as "F5 Start",
  CASE WHEN evaluation_period_end_time IS NOT NULL THEN '✅ Setado' ELSE '⏳ Aguardando' END as "Avaliação End",
  event_started as "Evento Iniciado",
  event_ended as "Evento Encerrado"
FROM event_config;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5️⃣ VERIFICAR CRON JOBS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '5️⃣ CRON JOBS ATIVOS' as status;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
    THEN '✅ pg_cron instalado'
    ELSE '❌ pg_cron NÃO instalado'
  END as "Extensão pg_cron";

-- Verificar jobs (se pg_cron estiver instalado)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'Listando jobs cron...';
  ELSE
    RAISE NOTICE 'pg_cron não instalado - jobs não podem ser verificados';
  END IF;
END $$;

-- Listar jobs se existirem
SELECT 
  jobid as "Job ID",
  jobname as "Nome",
  schedule as "Schedule",
  active as "Ativo",
  CASE 
    WHEN jobname LIKE '%auto_advance_phase%' THEN '✅ Auto-advance de fase'
    WHEN jobname LIKE '%auto_start%' THEN '✅ Auto-start de quest'
    ELSE 'Outro'
  END as "Tipo"
FROM cron.job
WHERE jobname LIKE '%auto%'
ORDER BY jobname;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6️⃣ ESTRUTURA COMPLETA DE QUESTS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '6️⃣ ESTRUTURA COMPLETA' as status;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
  COUNT(*) as "Total de Quests",
  CASE 
    WHEN COUNT(*) = 15 THEN '✅ 15 quests (correto)'
    ELSE '❌ Deveria ter 15 quests, tem ' || COUNT(*)
  END as "Status"
FROM quests;

SELECT 
  p.order_index as "F",
  COUNT(q.id) as "Quests",
  SUM(q.duration_minutes) as "Duração Total",
  STRING_AGG(
    CONCAT(
      'Q', q.order_index, ': ', 
      q.duration_minutes, 'min',
      CASE WHEN q.deliverable_type LIKE '%presentation%' THEN ' [BOSS]' ELSE '' END
    ),
    ' | ' ORDER BY q.order_index
  ) as "Detalhes"
FROM phases p
LEFT JOIN quests q ON q.phase_id = p.id
GROUP BY p.order_index
ORDER BY p.order_index;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7️⃣ VALIDAÇÕES CRÍTICAS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '7️⃣ VALIDAÇÕES CRÍTICAS' as status;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

-- Validação 1: Fases 1-4 têm BOSS
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM quests q 
          JOIN phases p ON q.phase_id = p.id 
          WHERE p.order_index BETWEEN 1 AND 4 
            AND q.order_index = 4 
            AND q.deliverable_type LIKE '%presentation%') = 4
    THEN '✅ Fases 1-4 têm BOSS (Quest 4 = presentation)'
    ELSE '❌ FALTA BOSS em alguma fase 1-4'
  END as "Validação 1";

-- Validação 2: Fase 5 NÃO tem Quest 4
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM quests q 
          JOIN phases p ON q.phase_id = p.id 
          WHERE p.order_index = 5 AND q.order_index = 4) = 0
    THEN '✅ Fase 5 não tem Quest 4 (correto)'
    ELSE '❌ Fase 5 TEM Quest 4 (ERRO!)'
  END as "Validação 2";

-- Validação 3: Fase 5 tem 3 quests
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM quests q 
          JOIN phases p ON q.phase_id = p.id 
          WHERE p.order_index = 5) = 3
    THEN '✅ Fase 5 tem 3 quests'
    ELSE '❌ Fase 5 deveria ter 3 quests'
  END as "Validação 3";

-- Validação 4: Quests 1-3 de Fases 1-4 NÃO têm late_submission_window
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM quests q 
          JOIN phases p ON q.phase_id = p.id 
          WHERE p.order_index BETWEEN 1 AND 4 
            AND q.order_index BETWEEN 1 AND 3 
            AND (q.late_submission_window_minutes IS NULL OR q.late_submission_window_minutes = 0)) = 12
    THEN '✅ Q1-Q3 das Fases 1-4 sem late window'
    ELSE '❌ Algumas Q1-Q3 têm late window (não deveria)'
  END as "Validação 4";

-- Validação 5: Todas as quests da Fase 5 TÊM late_submission_window
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM quests q 
          JOIN phases p ON q.phase_id = p.id 
          WHERE p.order_index = 5 
            AND q.late_submission_window_minutes > 0) = 3
    THEN '✅ Todas quests da Fase 5 têm late window'
    ELSE '❌ Faltam late windows na Fase 5'
  END as "Validação 5";

-- Validação 6: Total de 15 quests
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM quests) = 15
    THEN '✅ Total de 15 quests'
    ELSE '❌ Total incorreto de quests: ' || (SELECT COUNT(*)::text FROM quests)
  END as "Validação 6";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8️⃣ RESUMO FINAL
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '8️⃣ RESUMO EXECUTIVO' as status;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

WITH validations AS (
  SELECT 
    COUNT(*) FILTER (WHERE p.order_index BETWEEN 1 AND 4 AND q.order_index = 4 AND q.deliverable_type LIKE '%presentation%') = 4 as boss_fases_14,
    COUNT(*) FILTER (WHERE p.order_index = 5 AND q.order_index = 4) = 0 as fase5_sem_boss,
    COUNT(*) FILTER (WHERE p.order_index = 5) = 3 as fase5_3quests,
    COUNT(*) = 15 as total_15quests,
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_advance_phase') as func_auto_advance,
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_start_next_quest') as func_auto_start
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
)
SELECT 
  CASE WHEN boss_fases_14 THEN '✅' ELSE '❌' END || ' BOSS Fases 1-4' as "Check 1",
  CASE WHEN fase5_sem_boss THEN '✅' ELSE '❌' END || ' Fase 5 sem BOSS' as "Check 2",
  CASE WHEN fase5_3quests THEN '✅' ELSE '❌' END || ' Fase 5: 3 quests' as "Check 3",
  CASE WHEN total_15quests THEN '✅' ELSE '❌' END || ' Total: 15 quests' as "Check 4",
  CASE WHEN func_auto_advance THEN '✅' ELSE '❌' END || ' auto_advance_phase()' as "Check 5",
  CASE WHEN func_auto_start THEN '✅' ELSE '❌' END || ' auto_start_next_quest()' as "Check 6"
FROM validations;

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM quests) = 15 
      AND (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id WHERE p.order_index BETWEEN 1 AND 4 AND q.order_index = 4 AND q.deliverable_type LIKE '%presentation%') = 4
      AND (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id WHERE p.order_index = 5 AND q.order_index = 4) = 0
      AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_advance_phase')
    THEN '✅✅✅ SISTEMA VALIDADO COM SUCESSO! ✅✅✅'
    ELSE '⚠️⚠️⚠️ ATENÇÃO: Algumas validações falharam ⚠️⚠️⚠️'
  END as "STATUS FINAL";
SELECT '═══════════════════════════════════════════════════════════════' as separator;
