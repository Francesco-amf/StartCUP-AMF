-- ============================================================================
-- AUDITORIA COMPLETA DO SISTEMA DE AUTO-ADVANCE
-- ============================================================================
-- Este script verifica TODOS os componentes do sistema de auto-advance
-- entre quests e fases, incluindo pg_cron, triggers, funções e estado atual
-- ============================================================================

-- ==================================================
-- PARTE 1: VERIFICAR EXTENSÕES E CRON JOBS
-- ==================================================

SELECT '========== VERIFICANDO EXTENSÕES ==========' as step;

-- Verificar se pg_cron está habilitado
SELECT 
  extname as extensao,
  extversion as versao,
  nspname as schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'pg_cron';

SELECT '========== VERIFICANDO JOBS CRON AGENDADOS ==========' as step;

-- Verificar jobs cron agendados
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active,
  database
FROM cron.job
WHERE jobname LIKE '%auto%advance%' 
   OR jobname LIKE '%auto%start%'
ORDER BY jobname;

-- ==================================================
-- PARTE 2: VERIFICAR FUNÇÕES SQL
-- ==================================================

SELECT '========== VERIFICANDO FUNÇÕES SQL ==========' as step;

-- Listar todas as funções relacionadas a auto-advance
SELECT 
  p.proname as funcao,
  pg_get_function_arguments(p.oid) as argumentos,
  pg_get_functiondef(p.oid) as definicao_completa
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%auto%advance%' 
    OR p.proname LIKE '%auto%start%'
    OR p.proname LIKE '%manage_phase%'
    OR p.proname = 'close_quest'
  )
ORDER BY p.proname;

-- ==================================================
-- PARTE 3: VERIFICAR TRIGGERS
-- ==================================================

SELECT '========== VERIFICANDO TRIGGERS ==========' as step;

-- Listar todos os triggers relacionados a quests e auto-advance
SELECT 
  t.tgname as trigger_name,
  c.relname as tabela,
  p.proname as funcao_associada,
  CASE t.tgtype::int & 1
    WHEN 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END as nivel,
  CASE t.tgtype::int & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END as timing,
  CASE 
    WHEN t.tgtype::int & 4 > 0 THEN 'INSERT '
    ELSE ''
  END ||
  CASE 
    WHEN t.tgtype::int & 8 > 0 THEN 'DELETE '
    ELSE ''
  END ||
  CASE 
    WHEN t.tgtype::int & 16 > 0 THEN 'UPDATE '
    ELSE ''
  END as eventos,
  t.tgenabled as ativo,
  pg_get_triggerdef(t.oid) as definicao_completa
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('quests', 'phases', 'event_config')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ==================================================
-- PARTE 4: VERIFICAR ESTADO ATUAL DO EVENTO
-- ==================================================

SELECT '========== VERIFICANDO EVENT_CONFIG ==========' as step;

SELECT 
  current_phase,
  event_started,
  event_ended,
  phase_1_start_time,
  phase_2_start_time,
  phase_3_start_time,
  phase_4_start_time,
  phase_5_start_time,
  updated_at
FROM event_config;

-- ==================================================
-- PARTE 5: VERIFICAR QUESTS DA FASE ATUAL
-- ==================================================

SELECT '========== VERIFICANDO QUESTS DA FASE ATUAL ==========' as step;

SELECT 
  p.order_index as fase,
  q.order_index as quest_num,
  q.name as nome,
  q.status,
  q.started_at,
  q.planned_deadline_minutes as duracao_minutos,
  q.late_submission_window_minutes as janela_atraso,
  CASE 
    WHEN q.started_at IS NULL THEN 'NÃO INICIADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN 'EXPIRADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN 'ATRASADA'
    ELSE 'ATIVA'
  END as situacao,
  CASE 
    WHEN q.started_at IS NOT NULL AND q.planned_deadline_minutes IS NOT NULL THEN
      q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')
    ELSE NULL
  END as expira_em
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = (SELECT current_phase FROM event_config LIMIT 1)
ORDER BY q.order_index;

-- ==================================================
-- PARTE 6: VERIFICAR SUBMISSÕES DAS QUESTS
-- ==================================================

SELECT '========== VERIFICANDO SUBMISSÕES ==========' as step;

SELECT 
  p.order_index as fase,
  q.order_index as quest_num,
  q.name as nome,
  COUNT(s.id) as total_submissoes,
  MAX(s.created_at) as ultima_submissao
FROM quests q
JOIN phases p ON q.phase_id = p.id
LEFT JOIN submissions s ON s.quest_id = q.id
WHERE p.order_index = (SELECT current_phase FROM event_config LIMIT 1)
GROUP BY p.order_index, q.order_index, q.name
ORDER BY q.order_index;

-- ==================================================
-- PARTE 7: TESTAR FUNÇÃO AUTO_ADVANCE (SE EXISTIR)
-- ==================================================

SELECT '========== TESTANDO FUNÇÃO auto_advance_phase() ==========' as step;

-- Testar se a função existe e executá-la em modo dry-run (se possível)
DO $$
DECLARE
  v_function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'auto_advance_phase'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    RAISE NOTICE '✅ Função auto_advance_phase() EXISTE';
    RAISE NOTICE '⚠️ Execute manualmente: SELECT auto_advance_phase(); para ver logs detalhados';
  ELSE
    RAISE NOTICE '❌ Função auto_advance_phase() NÃO EXISTE';
    RAISE NOTICE '⚠️ Sistema de auto-advance via cron pode estar DESABILITADO';
  END IF;
END $$;

-- ==================================================
-- PARTE 8: VERIFICAR LOGS RECENTES (SE EXISTIR TABELA)
-- ==================================================

SELECT '========== VERIFICANDO QUEST_ACTIVITY_LOG ==========' as step;

-- Verificar se existe tabela de logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quest_activity_log') THEN
    RAISE NOTICE '✅ Tabela quest_activity_log EXISTE';
  ELSE
    RAISE NOTICE '❌ Tabela quest_activity_log NÃO EXISTE';
  END IF;
END $$;

-- ==================================================
-- PARTE 9: RESUMO E DIAGNÓSTICO
-- ==================================================

SELECT '========== RESUMO DO SISTEMA ==========' as step;

-- Resumo geral
SELECT
  '1. pg_cron habilitado?' as verificacao,
  CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') 
    THEN '✅ SIM' ELSE '❌ NÃO' 
  END as status
UNION ALL
SELECT
  '2. Jobs cron ativos?',
  CASE WHEN EXISTS (SELECT 1 FROM cron.job WHERE active = true AND (jobname LIKE '%auto%advance%' OR jobname LIKE '%auto%start%'))
    THEN '✅ SIM' ELSE '❌ NÃO' 
  END
UNION ALL
SELECT
  '3. Função auto_advance_phase() existe?',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_advance_phase')
    THEN '✅ SIM' ELSE '❌ NÃO' 
  END
UNION ALL
SELECT
  '4. Trigger auto_set_quest_started_at ativo?',
  CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'auto_set_quest_started_at' AND tgenabled = 'O')
    THEN '✅ SIM' ELSE '❌ NÃO' 
  END
UNION ALL
SELECT
  '5. Evento iniciado?',
  CASE WHEN EXISTS (SELECT 1 FROM event_config WHERE event_started = true)
    THEN '✅ SIM' ELSE '❌ NÃO' 
  END
UNION ALL
SELECT
  '6. Quests não iniciadas na fase atual?',
  CASE WHEN EXISTS (
    SELECT 1 FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = (SELECT current_phase FROM event_config LIMIT 1)
      AND q.started_at IS NULL
  ) THEN '⚠️ SIM (pode impedir auto-advance)' ELSE '✅ NÃO' 
  END;

-- ==================================================
-- FIM DA AUDITORIA
-- ==================================================

SELECT '========== AUDITORIA CONCLUÍDA ==========' as step;
SELECT 'Revise os resultados acima para identificar problemas' as instrucao;
