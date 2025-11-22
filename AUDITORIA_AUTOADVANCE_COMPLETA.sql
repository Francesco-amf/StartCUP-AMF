-- ============================================================================
-- AUDITORIA DETALHADA: Sistema de Auto-Advance (Quests e Fases) com CRON PG
-- ============================================================================
-- Investigação:
-- 1. Verificar se as funções CRON estão ativadas e configuradas
-- 2. Auditar lógica de auto_advance_phase()
-- 3. Auditar lógica de auto_start_next_quest()
-- 4. Validar transições de estado
-- 5. Verificar histórico de execuções
-- ============================================================================

-- PASSO 1: VERIFICAR EXTENSÃO CRON E STATUS
-- ================================================================
SELECT 
  '1. STATUS DO CRON POSTGRESQL' as secao,
  extname as extensao,
  extversion as versao,
  'Ativa' as status
FROM pg_extension
WHERE extname = 'pg_cron'
UNION ALL
SELECT 
  '1. STATUS DO CRON POSTGRESQL',
  'pg_cron',
  'N/A',
  'NÃO INSTALADA' 
WHERE NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- PASSO 2: LISTAR TODOS OS JOBS CRON CONFIGURADOS
-- ================================================================
SELECT 
  '2. JOBS CRON CONFIGURADOS' as secao,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  CASE WHEN active THEN '✅ ATIVO' ELSE '❌ INATIVO' END as status
FROM cron.job
ORDER BY jobname;

-- PASSO 3: HISTÓRICO DE EXECUÇÕES CRON (últimas 24 horas)
-- ================================================================
SELECT 
  '3. HISTÓRICO EXECUÇÕES CRON (24h)' as secao,
  job_name,
  start_time,
  end_time,
  EXTRACT(EPOCH FROM (end_time - start_time))::NUMERIC as duracao_segundos,
  status as resultado,
  command,
  CASE 
    WHEN status = 'succeeded' THEN '✅ SUCESSO'
    WHEN status = 'failed' THEN '❌ FALHA'
    WHEN status = 'running' THEN '⏳ EXECUTANDO'
    ELSE status
  END as status_legivel
FROM cron.job_run_details
WHERE start_time > NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC;

-- PASSO 4: VERIFICAR FUNÇÃO auto_advance_phase()
-- ================================================================
SELECT 
  '4. FUNÇÃO auto_advance_phase() - CÓDIGO FONTE' as secao,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definicao
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'auto_advance_phase'
AND n.nspname = 'public';

-- PASSO 5: VERIFICAR FUNÇÃO auto_start_next_quest()
-- ================================================================
SELECT 
  '5. FUNÇÃO auto_start_next_quest() - CÓDIGO FONTE' as secao,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definicao
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'auto_start_next_quest'
AND n.nspname = 'public';

-- PASSO 6: AUDITORIA DE TRANSIÇÕES - Fases que avançaram
-- ================================================================
SELECT 
  '6. TRANSIÇÕES DE FASES (últimas 7 dias)' as secao,
  t.name as team_name,
  p.name as phase_name,
  p.order_index,
  pf.current_phase_id,
  COUNT(*) as quests_na_fase,
  COUNT(CASE WHEN q.completed_at IS NOT NULL THEN 1 END) as quests_completas,
  p.ended_at as fase_finalizada_em,
  CASE 
    WHEN p.ended_at > NOW() - INTERVAL '24 hours' THEN '🆕 HOJE'
    WHEN p.ended_at > NOW() - INTERVAL '7 days' THEN '📅 ÚLTIMOS 7 DIAS'
    ELSE '📊 ANTIGO'
  END as recencia
FROM phases p
JOIN teams t ON p.team_id = t.id
LEFT JOIN phase_flows pf ON p.team_id = pf.team_id
LEFT JOIN quests q ON p.id = p.id AND q.phase_id = p.id
WHERE p.ended_at IS NOT NULL 
  AND p.ended_at > NOW() - INTERVAL '7 days'
GROUP BY t.name, p.name, p.order_index, pf.current_phase_id, p.ended_at
ORDER BY p.ended_at DESC;

-- PASSO 7: AUDITORIA DE TRANSIÇÕES - Quests que começaram
-- ================================================================
SELECT 
  '7. TRANSIÇÕES DE QUESTS (últimas 7 dias)' as secao,
  t.name as team_name,
  q.name as quest_name,
  q.order_index,
  q.started_at as quest_iniciada_em,
  q.planned_deadline_minutes as prazo_minutos,
  (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) as deadline_calculado,
  COUNT(s.id) as total_submissoes,
  COUNT(CASE WHEN s.status = 'evaluated' THEN 1 END) as submissoes_avaliadas,
  CASE 
    WHEN q.started_at > NOW() - INTERVAL '24 hours' THEN '🆕 HOJE'
    WHEN q.started_at > NOW() - INTERVAL '7 days' THEN '📅 ÚLTIMOS 7 DIAS'
    ELSE '📊 ANTIGO'
  END as recencia
FROM quests q
JOIN teams t ON q.team_id = t.id
LEFT JOIN submissions s ON q.id = s.quest_id
WHERE q.started_at IS NOT NULL 
  AND q.started_at > NOW() - INTERVAL '7 days'
GROUP BY t.name, q.name, q.order_index, q.started_at, q.planned_deadline_minutes
ORDER BY q.started_at DESC;

-- PASSO 8: VALIDAÇÃO - Estados inconsistentes
-- ================================================================
WITH phase_state AS (
  SELECT 
    t.id as team_id,
    t.name as team_name,
    p.id as phase_id,
    p.name as phase_name,
    p.order_index as phase_order,
    p.ended_at as phase_ended_at,
    COUNT(q.id) as total_quests,
    COUNT(CASE WHEN q.completed_at IS NOT NULL THEN 1 END) as quests_completas,
    COUNT(q.id) = COUNT(CASE WHEN q.completed_at IS NOT NULL THEN 1 END) as todas_completas
  FROM phases p
  JOIN teams t ON p.team_id = t.id
  LEFT JOIN quests q ON p.id = q.phase_id
  GROUP BY t.id, t.name, p.id, p.name, p.order_index, p.ended_at
)
SELECT 
  '8. VALIDAÇÃO - ESTADOS INCONSISTENTES' as secao,
  team_name,
  phase_name,
  CASE 
    WHEN phase_ended_at IS NOT NULL AND todas_completas THEN '✅ CORRETO: Fase finalizada com todas quests completas'
    WHEN phase_ended_at IS NOT NULL AND NOT todas_completas THEN '⚠️ AVISO: Fase finalizada mas nem todas quests completas'
    WHEN phase_ended_at IS NULL AND todas_completas THEN '⚠️ AVISO: Todas quests completas mas fase não finalizada'
    WHEN phase_ended_at IS NULL AND NOT todas_completas THEN '✅ CORRETO: Fase em andamento com quests incompletas'
    ELSE '❓ ESTADO DESCONHECIDO'
  END as validacao,
  total_quests,
  quests_completas,
  phase_ended_at
FROM phase_state
WHERE phase_ended_at > NOW() - INTERVAL '7 days'
  OR (phase_ended_at IS NULL AND total_quests > 0)
ORDER BY team_name, phase_order;

-- PASSO 9: LÓGICA DE auto_advance_phase() - DETALHES
-- ================================================================
SELECT 
  '9. ANÁLISE: Como auto_advance_phase() Funciona' as secao,
  'RESUMO DA LÓGICA' as tipo,
  'A função verifica:
1. Quantas quests foram completadas na fase
2. Se a quantidade = total de quests na fase
3. Se SIM → marca phase.ended_at = NOW()
4. Se NÃO → fase continua aberta

IMPORTANTE: NÃO verifica submissions!
Apenas conta quests.completed_at preenchidos' as descricao;

-- PASSO 10: LÓGICA DE auto_start_next_quest() - DETALHES
-- ================================================================
SELECT 
  '10. ANÁLISE: Como auto_start_next_quest() Funciona' as secao,
  'RESUMO DA LÓGICA' as tipo,
  'A função verifica:
1. Qual é a próxima quest não iniciada
2. Se a quest anterior foi completada
3. Se SIM → inicia a próxima quest (started_at = NOW())
4. Se NÃO → aguarda conclusão da anterior

GATILHO: Rodas a cada 1 minuto via CRON' as descricao;

-- PASSO 11: FLUXO ESPERADO - Sequência correta
-- ================================================================
SELECT 
  '11. FLUXO ESPERADO - Sequência Correta' as secao,
  'PASSO 1' as etapa,
  'Quest 1.1 iniciada (started_at = NOW())' as acao
UNION ALL
SELECT '11. FLUXO ESPERADO', 'PASSO 2', 'Equipe submete entrega'
UNION ALL
SELECT '11. FLUXO ESPERADO', 'PASSO 3', 'Frontend poll detecta submissão em 1.5s'
UNION ALL
SELECT '11. FLUXO ESPERADO', 'PASSO 4', 'Avaliador marca como completa (completed_at = NOW())'
UNION ALL
SELECT '11. FLUXO ESPERADO', 'PASSO 5', 'CRON dispara auto_start_next_quest() (1 min)'
UNION ALL
SELECT '11. FLUXO ESPERADO', 'PASSO 6', 'Quest 1.2 iniciada (started_at = NOW())'
UNION ALL
SELECT '11. FLUXO ESPERADO', 'PASSO 7', 'Frontend atualiza e mostra Quest 1.2'
UNION ALL
SELECT '11. FLUXO ESPERADO', 'PASSO 8', 'Todas quests da fase 1 completadas'
UNION ALL
SELECT '11. FLUXO ESPERADO', 'PASSO 9', 'CRON dispara auto_advance_phase() (detecta fim)'
UNION ALL
SELECT '11. FLUXO ESPERADO', 'PASSO 10', 'Fase 1 marcada como finalizada (ended_at = NOW())'
UNION ALL
SELECT '11. FLUXO ESPERADO', 'PASSO 11', 'Fase 2 ativada para equipe'
UNION ALL
SELECT '11. FLUXO ESPERADO', 'PASSO 12', 'Primeira Quest da Fase 2 iniciada automaticamente';

-- PASSO 12: PROBLEMAS POTENCIAIS - Checklist
-- ================================================================
SELECT 
  '12. PROBLEMAS POTENCIAIS - Checklist' as secao,
  'Problema 1' as problema,
  'CRON não executando' as sintoma,
  'Verificar: SELECT * FROM cron.job' as diagnostico
UNION ALL
SELECT '12. PROBLEMAS POTENCIAIS', 'Problema 2', 'Quest não inicia após conclusão', 'Verificar: Quest anterior tem completed_at preenchido?'
UNION ALL
SELECT '12. PROBLEMAS POTENCIAIS', 'Problema 3', 'Fase não avança', 'Verificar: Todas as quests têm completed_at?'
UNION ALL
SELECT '12. PROBLEMAS POTENCIAIS', 'Problema 4', 'Demora > 1 minuto para iniciar próxima quest', 'Normal: CRON roda a cada 1 minuto'
UNION ALL
SELECT '12. PROBLEMAS POTENCIAIS', 'Problema 5', 'Quest 1.2 não aparece depois de 1.1', 'Verificar: polling em SubmissionWrapper.tsx funcionando?';
