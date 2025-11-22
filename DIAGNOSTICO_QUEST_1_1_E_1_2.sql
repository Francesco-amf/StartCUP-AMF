-- ============================================
-- DIAGNÓSTICO: Estado de Quest 1.1 e 1.2
-- ============================================

\echo ''
\echo '╔═══════════════════════════════════════════════════════════╗'
\echo '║ VERIFICANDO ESTADO DE QUEST 1.1 E 1.2 NA BASE DE DADOS   ║'
\echo '╚═══════════════════════════════════════════════════════════╝'
\echo ''

-- PASSO 1: Verificar Quest 1.1 no banco
\echo '=== 1. ESTADO DA QUEST 1.1 ==='
SELECT 
  q.id,
  q.name,
  q.description,
  q.status,
  q.started_at,
  q.started_at + (INTERVAL '30 minutes') as deadline_regular,
  q.started_at + (INTERVAL '45 minutes') as deadline_com_atraso,
  NOW(),
  ROUND(EXTRACT(EPOCH FROM (q.started_at + (INTERVAL '45 minutes') - NOW())) / 60) as minutos_restantes,
  CASE 
    WHEN q.started_at + (INTERVAL '45 minutes') < NOW() THEN 'EXPIRADA'
    WHEN q.started_at + (INTERVAL '30 minutes') < NOW() THEN 'ATRASADA (janela de 15min)'
    ELSE 'ATIVA'
  END as situacao
FROM quests q
WHERE q.name = 'Conhecendo o terreno' AND order_index = 1
ORDER BY q.created_at DESC;

\echo ''
\echo '=== 2. ESTADO DA QUEST 1.2 ==='
SELECT 
  q.id,
  q.name,
  q.status,
  q.started_at,
  CASE 
    WHEN q.status = 'active' THEN '🟢 ATIVA'
    WHEN q.status = 'inactive' THEN '🔴 INATIVA'
    ELSE q.status
  END as status_visual
FROM quests q
WHERE q.name LIKE '%1.2%' OR (q.order_index = 2 AND name LIKE '%Terreno%')
ORDER BY q.created_at DESC;

\echo ''
\echo '=== 3. SUBMISSÕES PARA QUEST 1.1 (por equipe) ==='
SELECT 
  t.id as team_id,
  t.name as team_name,
  COUNT(s.id) as total_submissoes,
  MAX(s.created_at) as ultima_submissao,
  STRING_AGG(DISTINCT s.deliverable_type, ', ') as tipos_enviados
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN quests q ON s.quest_id = q.id
WHERE q.name = 'Conhecendo o terreno' AND q.order_index = 1
GROUP BY t.id, t.name
ORDER BY t.name;

\echo ''
\echo '=== 4. VERIFICAR AUTO_ADVANCE LOGIC ==='
SELECT 
  'Questão 1.1' as quest,
  (
    SELECT COUNT(*) FROM quests 
    WHERE name = 'Conhecendo o terreno' AND order_index = 1
  ) as total_quest_1_1,
  (
    SELECT COUNT(*) FROM submissions s
    JOIN quests q ON s.quest_id = q.id
    WHERE q.name = 'Conhecendo o terreno' AND q.order_index = 1
  ) as total_submissoes_1_1,
  (
    SELECT COUNT(DISTINCT team_id) FROM submissions s
    JOIN quests q ON s.quest_id = q.id
    WHERE q.name = 'Conhecendo o terreno' AND q.order_index = 1
  ) as total_equipes_com_submissao_1_1;

\echo ''
\echo '=== 5. RESPOSTA À PERGUNTA: POR QUE 1.2 NÃO MOSTRA? ==='
\echo ''
\echo 'Se 1.1 está EXPIRADA ou tem SUBMISSÕES acima: Quest 1.2 DEVE MOSTRAR'
\echo 'Se 1.1 está ATIVA e SEM SUBMISSÃO: Quest 1.2 NÃO DEVE MOSTRAR (bloqueio frontend)'
\echo ''
\echo '⚡ RESUMO:'
\echo 'Quest 1.1 → status, minutos_restantes, situacao'
\echo 'Quest 1.2 → status (deve estar = active)'
\echo 'Se 1.2 está inativa, o problema é no AUTO_ADVANCE'
\echo 'Se 1.2 está ativa mas não mostra, o problema é no FRONTEND'
\echo ''
