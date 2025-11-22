-- ============================================================================
-- INVESTIGAÇÃO: Mistos Desincronizado - Backend vs Frontend
-- ============================================================================
-- Problema: Backend mostra Quest 1.3, Frontend mostra Quest 1.2
-- Causa provável: Cache no Frontend ou problema de sincronização

-- PASSO 1: ESTADO ATUAL DA EQUIPE MISTOS NO BACKEND
-- ================================================================
SELECT 
  '1. ESTADO BACKEND - MISTOS' as secao,
  t.id as team_id,
  t.name as team_name,
  pf.current_phase_id,
  p.name as current_phase_name,
  p.order_index as phase_order,
  COUNT(q.id) as total_quests_fase,
  COUNT(CASE WHEN q.completed_at IS NOT NULL THEN 1 END) as quests_completas,
  COUNT(CASE WHEN q.started_at IS NOT NULL THEN 1 END) as quests_iniciadas
FROM teams t
LEFT JOIN phase_flows pf ON t.id = pf.team_id
LEFT JOIN phases p ON pf.current_phase_id = p.id
LEFT JOIN quests q ON p.id = q.phase_id
WHERE t.name = 'Mistos'
GROUP BY t.id, t.name, pf.current_phase_id, p.name, p.order_index;

-- PASSO 2: HISTÓRICO COMPLETO DE QUESTS MISTOS
-- ================================================================
SELECT 
  '2. HISTÓRICO COMPLETO QUESTS - MISTOS' as secao,
  p.name as phase_name,
  p.order_index as phase_order,
  q.name as quest_name,
  q.order_index as quest_order,
  q.started_at,
  q.completed_at,
  CASE 
    WHEN q.completed_at IS NOT NULL THEN '✅ COMPLETA'
    WHEN q.started_at IS NOT NULL THEN '⏳ EM ANDAMENTO'
    ELSE '❌ NÃO INICIADA'
  END as status_quest,
  EXTRACT(EPOCH FROM (q.completed_at - q.started_at))::INTEGER / 60 as minutos_duracao,
  COUNT(s.id) as total_submissions,
  COUNT(CASE WHEN s.status = 'evaluated' THEN 1 END) as submissions_avaliadas
FROM quests q
JOIN phases p ON q.phase_id = p.id
JOIN teams t ON p.team_id = t.id
LEFT JOIN submissions s ON q.id = s.quest_id
WHERE t.name = 'Mistos'
GROUP BY p.name, p.order_index, q.id, q.name, q.order_index, q.started_at, q.completed_at
ORDER BY p.order_index, q.order_index;

-- PASSO 3: QUAL DEVE SER A PRÓXIMA QUEST VISÍVEL
-- ================================================================
WITH proxima_quest AS (
  SELECT 
    q.id,
    q.name,
    q.order_index,
    p.name as phase_name,
    p.order_index as phase_order,
    LAG(q.completed_at) OVER (ORDER BY q.order_index) as quest_anterior_completa
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  JOIN teams t ON p.team_id = t.id
  WHERE t.name = 'Mistos'
  ORDER BY q.order_index
)
SELECT 
  '3. QUAL DEVE SER A PRÓXIMA QUEST VISÍVEL' as secao,
  name as quest_name,
  order_index,
  phase_name,
  CASE 
    WHEN order_index = 1 THEN '✅ PRIMEIRA QUEST - SEMPRE VISÍVEL'
    WHEN quest_anterior_completa IS NOT NULL THEN '✅ ANTERIOR COMPLETA - VISÍVEL'
    ELSE '❌ ANTERIOR NÃO COMPLETA - NÃO VISÍVEL'
  END as deve_estar_visivel
FROM proxima_quest;

-- PASSO 4: COMPARAR - O QUE FRONTEND DEVERIA MOSTRAR vs O QUE MOSTRA
-- ================================================================
SELECT 
  '4. COMPARAÇÃO ESPERADO vs REALIDADE' as secao,
  'BACKEND: A equipe deve estar vendo Quest 1.3' as esperado,
  'FRONTEND: Mas está mostrando Quest 1.2' as realidade,
  'MOTIVO PROVÁVEL: Cache no navegador ou resposta atrasada da API' as causa;

-- PASSO 5: VERIFICAR TIMESTAMPS DE MUDANÇA
-- ================================================================
SELECT 
  '5. TIMELINE DE MUDANÇAS' as secao,
  q.name as quest_name,
  q.started_at,
  q.completed_at,
  q.updated_at,
  EXTRACT(EPOCH FROM (NOW() - q.completed_at))::INTEGER / 60 as minutos_desde_conclusao,
  CASE 
    WHEN q.completed_at > NOW() - INTERVAL '5 minutes' THEN '🆕 MUDANÇA MUITO RECENTE'
    WHEN q.completed_at > NOW() - INTERVAL '30 minutes' THEN '📅 MUDANÇA RECENTE'
    ELSE '📊 MUDANÇA ANTIGA'
  END as recencia
FROM quests q
JOIN phases p ON q.phase_id = p.id
JOIN teams t ON p.team_id = t.id
WHERE t.name = 'Mistos'
  AND q.completed_at IS NOT NULL
ORDER BY q.completed_at DESC;

-- PASSO 6: VERIFICAR SE HÁ PROBLEMA DE POLLING
-- ================================================================
SELECT 
  '6. DIAGNÓSTICO: PROBLEMA DE POLLING' as secao,
  'Se a mudança foi recente (últimos 5 minutos)' as condicao,
  'O Frontend pode não ter atualizado ainda via polling' as explicacao,
  'Solução: Pressione F5 para forçar refresh' as acao;

-- PASSO 7: VERIFICAR CACHE - DADOS EM submissions TABLE
-- ================================================================
SELECT 
  '7. VERIFICAR CACHE - SUBMISSIONS MISTOS' as secao,
  q.name as quest_name,
  q.order_index,
  COUNT(s.id) as total_submissions,
  COUNT(CASE WHEN s.status = 'evaluated' THEN 1 END) as evaluated,
  COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN s.deleted_at IS NOT NULL THEN 1 END) as deletadas,
  MAX(s.submitted_at) as ultima_submissao,
  MAX(s.updated_at) as ultima_atualizacao
FROM quests q
JOIN phases p ON q.phase_id = p.id
JOIN teams t ON p.team_id = t.id
LEFT JOIN submissions s ON q.id = s.quest_id
WHERE t.name = 'Mistos'
GROUP BY q.name, q.order_index
ORDER BY q.order_index;

-- PASSO 8: SUGESTÕES DE FIX
-- ================================================================
SELECT 
  '8. POSSÍVEIS SOLUÇÕES' as secao,
  'Solução 1' as tipo,
  'Forçar refresh no navegador (F5 ou Ctrl+Shift+R)' as acao,
  'Efetividade: Alta - Limpa cache local' as nota
UNION ALL
SELECT '8. POSSÍVEIS SOLUÇÕES', 'Solução 2', 'Aumentar frequência de polling no Frontend', 'Mude de 1.5s para 500ms em SubmissionWrapper.tsx'
UNION ALL
SELECT '8. POSSÍVEIS SOLUÇÕES', 'Solução 3', 'Adicionar invalidação de cache automática', 'Implementar revalidateTag() após quest completion'
UNION ALL
SELECT '8. POSSÍVEIS SOLUÇÕES', 'Solução 4', 'Websocket para sincronização real-time', 'Substitua polling por subscription do Supabase'
UNION ALL
SELECT '8. POSSÍVEIS SOLUÇÕES', 'Solução 5', 'Sincronizar no componente QuestAutoAdvancer', 'Forçar refetch quando detectar mudança de quest';

-- PASSO 9: VERIFICAR SE É PROBLEMA DE LÓGICA
-- ================================================================
SELECT 
  '9. VERIFICAR LÓGICA NO FRONTEND' as secao,
  'Arquivo: src/components/QuestAutoAdvancer.tsx' as arquivo,
  'Verificar: Está consultando current_phase_id de phase_flows?' as verificar1,
  'Verificar: Está filtrando apenas quests que já iniciaram?' as verificar2,
  'Verificar: Intervalo de polling é de 500ms?' as verificar3;

-- PASSO 10: SCRIPT DE TESTE
-- ================================================================
SELECT 
  '10. TESTE RÁPIDO' as secao,
  'Execute: SELECT * FROM phase_flows WHERE team_id = (SELECT id FROM teams WHERE name = ''Mistos'');' as comando1,
  'Resultado esperado: current_phase_id deve apontar para Fase 2 (ou a atual)' as resultado1,
  'Se apontar para Fase 1, há inconsistência no backend' as nota1;
