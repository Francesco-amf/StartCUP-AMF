-- ============================================================================
-- AUDITORIA COMPLETA: Sistema de Entregas - Erros 500 e Validação de Prazos
-- ============================================================================
-- Este script investiga:
-- 1. Submissões que falharam (erro 500, timeouts, rejeitadas)
-- 2. Validação de prazos normais vs atraso
-- 3. Histórico de tentativas de submissão por equipe
-- 4. Correlação entre erro e situação de deadline
-- ============================================================================

-- PASSO 1: SUBMISSÕES COM ERRO OU FALHA (últimas 72 horas)
-- ================================================================
SELECT 
  '1. SUBMISSÕES COM ERRO/REJEITADAS' as secao,
  t.name as team_name,
  q.name as quest_name,
  s.id,
  s.submitted_at,
  s.status,
  CASE 
    WHEN s.status = 'rejected' THEN '🚫 REJEITADA'
    WHEN s.status = 'error' THEN '⚠️ ERRO'
    WHEN s.status = 'pending' THEN '⏳ AGUARDANDO'
    WHEN s.status = 'evaluated' THEN '✅ AVALIADA'
    WHEN s.status = 'submitted' THEN '📤 SUBMETIDA'
    ELSE '❓ ' || s.status
  END as status_legivel,
  s.submitted_at,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  q.started_at,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) as deadline_regular,
  (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) as deadline_final,
  EXTRACT(EPOCH FROM (s.submitted_at - (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute'))))::INTEGER / 60 as minutos_apos_deadline,
  s.file_url,
  q.deliverable_type
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
WHERE s.submitted_at > NOW() - INTERVAL '72 hours'
ORDER BY s.submitted_at DESC;

-- PASSO 2: VALIDAÇÃO DE PRAZOS - Comparar com_started_at + deadline
-- ================================================================
WITH submission_deadline_analysis AS (
  SELECT 
    t.name as team_name,
    q.name as quest_name,
    q.order_index,
    s.id as submission_id,
    s.submitted_at,
    q.started_at,
    q.planned_deadline_minutes,
    q.late_submission_window_minutes,
    (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) as deadline_regular,
    (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) as deadline_final,
    CASE 
      WHEN s.submitted_at IS NULL THEN 'Não submetida'
      WHEN s.submitted_at <= (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '✅ NO PRAZO'
      WHEN s.submitted_at <= (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) THEN '⚠️ ATRASADA'
      ELSE '🚫 EXPIRADA'
    END as situacao_prazo,
    EXTRACT(EPOCH FROM (s.submitted_at - (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute'))))::INTEGER as segundos_apos_deadline,
    CEIL(EXTRACT(EPOCH FROM (s.submitted_at - (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')))) / 60)::INTEGER as minutos_apos_deadline,
    s.late_penalty_applied,
    s.status
  FROM submissions s
  JOIN teams t ON s.team_id = t.id
  JOIN quests q ON s.quest_id = q.id
  WHERE s.submitted_at > NOW() - INTERVAL '72 hours'
) SELECT 
  '2. VALIDAÇÃO DE PRAZOS E PENALIDADES' as secao,
  team_name,
  quest_name,
  submission_id,
  submitted_at,
  situacao_prazo,
  minutos_apos_deadline as minutos_de_atraso,
  late_penalty_applied as penalidade_aplicada,
  status,
  CASE 
    WHEN situacao_prazo = '✅ NO PRAZO' AND late_penalty_applied = 0 THEN '✅ CORRETO'
    WHEN situacao_prazo = '⚠️ ATRASADA' AND late_penalty_applied > 0 THEN '✅ CORRETO'
    WHEN situacao_prazo = '✅ NO PRAZO' AND late_penalty_applied > 0 THEN '❌ ERRO: Penalidade em submission no prazo'
    WHEN situacao_prazo = '⚠️ ATRASADA' AND late_penalty_applied = 0 THEN '❌ ERRO: Sem penalidade em submission atrasada'
    ELSE '⚠️ VERIFICAR'
  END as validacao
FROM submission_deadline_analysis
ORDER BY team_name, quest_name;

-- PASSO 3: TENTATIVAS DE SUBMISSÃO POR EQUIPE (histórico completo)
-- ================================================================
SELECT 
  '3. HISTÓRICO DE TENTATIVAS POR EQUIPE' as secao,
  t.name as team_name,
  q.name as quest_name,
  q.order_index,
  COUNT(*) as total_tentativas,
  COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as submetidas_com_sucesso,
  COUNT(CASE WHEN s.status = 'rejected' THEN 1 END) as rejeitadas,
  COUNT(CASE WHEN s.status = 'error' THEN 1 END) as erro,
  COUNT(CASE WHEN s.is_late THEN 1 END) as atrasadas,
  MAX(s.late_penalty_applied) as max_penalidade,
  MIN(s.submitted_at) as primeira_tentativa,
  MAX(s.submitted_at) as ultima_tentativa,
  EXTRACT(EPOCH FROM (MAX(s.submitted_at) - MIN(s.submitted_at)))::INTEGER / 60 as minutos_entre_primeira_ultima
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
WHERE s.submitted_at > NOW() - INTERVAL '7 days'
GROUP BY t.name, q.name, q.order_index
HAVING COUNT(*) > 1 OR COUNT(CASE WHEN s.status IN ('rejected', 'error') THEN 1 END) > 0
ORDER BY t.name, q.order_index;

-- PASSO 4: ANÁLISE DETALHADA - Correlação entre ERRO e DEADLINE
-- ================================================================
WITH error_analysis AS (
  SELECT 
    t.name as team_name,
    q.name as quest_name,
    s.id as submission_id,
    s.submitted_at,
    s.status,
    q.started_at,
    q.planned_deadline_minutes,
    CASE 
      WHEN s.submitted_at <= (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN 'PRAZO_NORMAL'
      WHEN s.submitted_at <= (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) THEN 'PRAZO_ATRASO'
      ELSE 'EXPIRADO'
    END as tipo_prazo,
    EXTRACT(EPOCH FROM (s.submitted_at - (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute'))))::INTEGER / 60 as minutos_apos_deadline
  FROM submissions s
  JOIN teams t ON s.team_id = t.id
  JOIN quests q ON s.quest_id = q.id
  WHERE s.submitted_at > NOW() - INTERVAL '72 hours'
    AND (s.status IN ('error', 'rejected') OR s.late_penalty_applied > 0)
) SELECT 
  '4. CORRELAÇÃO ERRO × DEADLINE' as secao,
  tipo_prazo,
  COUNT(*) as total_submissoes,
  COUNT(CASE WHEN status IN ('error', 'rejected') THEN 1 END) as com_erro,
  ROUND(
    (((COUNT(CASE WHEN status IN ('error', 'rejected') THEN 1 END)::FLOAT / COUNT(*)) * 100)::NUMERIC), 2
  ) as percentual_erro,
  MIN(minutos_apos_deadline) as min_minutos_apos_deadline,
  MAX(minutos_apos_deadline) as max_minutos_apos_deadline,
  ROUND((AVG(minutos_apos_deadline)::NUMERIC), 2) as media_minutos_apos_deadline
FROM error_analysis
GROUP BY tipo_prazo
ORDER BY CASE tipo_prazo WHEN 'PRAZO_NORMAL' THEN 1 WHEN 'PRAZO_ATRASO' THEN 2 ELSE 3 END;


-- PASSO 5: SUBMISSÕES REJEITADAS - Motivo e Padrão
-- ================================================================
SELECT 
  '5. SUBMISSÕES REJEITADAS - MOTIVOS' as secao,
  t.name as team_name,
  q.name as quest_name,
  s.id as submission_id,
  s.submitted_at,
  s.status,
  q.deliverable_type,
  s.file_url,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  CASE 
    WHEN s.late_minutes > 15 THEN '🚫 ALÉM DA JANELA DE ATRASO (>15min)'
    WHEN s.late_penalty_applied > 0 THEN '⚠️ COM PENALIDADE (dentro janela)'
    WHEN s.file_url IS NULL AND q.deliverable_type = 'file' THEN '📄 SEM ARQUIVO'
    WHEN s.submitted_at IS NULL THEN '⏳ NÃO FINALIZADA'
    ELSE '❓ OUTRO MOTIVO'
  END as motivo_provavel,
  q.started_at,
  (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) as deadline_regular,
  (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) as deadline_final
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
WHERE s.status = 'rejected'
  AND s.submitted_at > NOW() - INTERVAL '72 hours'
ORDER BY s.submitted_at DESC;

-- PASSO 6: FUNÇÃO DE VALIDAÇÃO - Testar lógica
-- ================================================================
SELECT 
  '6. TESTE DE VALIDAÇÃO - Função calculate_late_penalty' as secao,
  'Teste 1: Sem atraso (0 segundos)' as cenario,
  (SELECT calculate_late_penalty(0)) as penalidade,
  'Esperado: 0' as esperado
UNION ALL
SELECT '6. TESTE DE VALIDAÇÃO - Função calculate_late_penalty', 'Teste 2: 30 segundos (arredonda 1 min)', (SELECT calculate_late_penalty(30)), 'Esperado: 5'
UNION ALL
SELECT '6. TESTE DE VALIDAÇÃO - Função calculate_late_penalty', 'Teste 3: 3 minutos', (SELECT calculate_late_penalty(180)), 'Esperado: 5'
UNION ALL
SELECT '6. TESTE DE VALIDAÇÃO - Função calculate_late_penalty', 'Teste 4: 5 minutos', (SELECT calculate_late_penalty(300)), 'Esperado: 5'
UNION ALL
SELECT '6. TESTE DE VALIDAÇÃO - Função calculate_late_penalty', 'Teste 5: 7 minutos', (SELECT calculate_late_penalty(420)), 'Esperado: 10'
UNION ALL
SELECT '6. TESTE DE VALIDAÇÃO - Função calculate_late_penalty', 'Teste 6: 12 minutos', (SELECT calculate_late_penalty(720)), 'Esperado: 15'
UNION ALL
SELECT '6. TESTE DE VALIDAÇÃO - Função calculate_late_penalty', 'Teste 7: 16 minutos (rejeitado)', (SELECT calculate_late_penalty(960)), 'Esperado: -1 (rejeitado)';

-- PASSO 7: RESUMO EXECUTIVO
-- ================================================================
WITH stats AS (
  SELECT 
    COUNT(*) as total_submissoes,
    COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as sucesso,
    COUNT(CASE WHEN s.status IN ('rejected', 'error') THEN 1 END) as falha,
    COUNT(CASE WHEN s.is_late THEN 1 END) as atrasadas,
    COUNT(CASE WHEN s.late_penalty_applied > 0 THEN 1 END) as com_penalidade,
    COUNT(CASE WHEN s.submitted_at > (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) THEN 1 END) as apos_expiracao
  FROM submissions s
  JOIN quests q ON s.quest_id = q.id
  WHERE s.submitted_at > NOW() - INTERVAL '72 hours'
) SELECT 
  '7. RESUMO EXECUTIVO (72 horas)' as secao,
  'Total de submissões' as metrica,
  total_submissoes::TEXT as valor
FROM stats
UNION ALL
SELECT '7. RESUMO EXECUTIVO (72 horas)', 'Total com penalidade', com_penalidade::TEXT FROM stats
UNION ALL
SELECT '7. RESUMO EXECUTIVO (72 horas)', 'Total atrasadas', atrasadas::TEXT FROM stats
UNION ALL
SELECT '7. RESUMO EXECUTIVO (72 horas)', 'Além da expiração', apos_expiracao::TEXT FROM stats;

