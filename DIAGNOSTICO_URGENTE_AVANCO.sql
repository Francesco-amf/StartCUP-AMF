-- =====================================================
-- DIAGNÓSTICO URGENTE: EQUIPE AVANÇOU PREMATURAMENTE
-- =====================================================

-- 1️⃣ VERIFICAR ESTADO ATUAL DAS QUESTS
SELECT '🚨 STATUS ATUAL' as "Status";

SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name,
  COUNT(s.id) as "Submissões",
  COUNT(DISTINCT s.team_id) as "Equipes que submeteram"
FROM quests q
JOIN phases p ON q.phase_id = p.id
LEFT JOIN submissions s ON q.id = s.quest_id
GROUP BY p.order_index, q.order_index, q.id, q.name
ORDER BY p.order_index, q.order_index;

-- 2️⃣ VERIFICAR QUAL EQUIPE AVANÇOU
SELECT '─────────────────────────────────────' as "separator";
SELECT '🔍 EQUIPES COM SUBMISSÕES EM MÚLTIPLAS QUESTS' as "Status";

SELECT 
  t.name as "Equipe",
  COUNT(DISTINCT s.quest_id) as "Quests com submissão",
  STRING_AGG(DISTINCT CONCAT(p.order_index, '.', q.order_index), ' | ' ORDER BY CONCAT(p.order_index, '.', q.order_index)) as "Quests",
  COUNT(s.id) as "Total submissões"
FROM teams t
JOIN submissions s ON t.id = s.team_id
JOIN quests q ON s.quest_id = q.id
JOIN phases p ON q.phase_id = p.id
GROUP BY t.id, t.name
HAVING COUNT(DISTINCT s.quest_id) > 1
ORDER BY COUNT(DISTINCT s.quest_id) DESC;

-- 3️⃣ VERIFICAR SE HÁ MÚLTIPLAS QUESTS ATIVAS SIMULTANEAMENTE
SELECT '─────────────────────────────────────' as "separator";
SELECT '⚠️ QUESTS ATIVAS AGORA' as "Status";

SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name,
  COUNT(s.id) as "Submissões recentes"
FROM quests q
JOIN phases p ON q.phase_id = p.id
LEFT JOIN submissions s ON q.id = s.quest_id
WHERE q.status = 'active'
GROUP BY p.order_index, q.order_index, q.id, q.name
ORDER BY p.order_index, q.order_index;

-- 4️⃣ VERIFICAR CONFIGURAÇÃO DO EVENTO
SELECT '─────────────────────────────────────' as "separator";
SELECT '⚙️ CONFIGURAÇÃO EVENTO' as "Status";

SELECT 
  current_phase as "Fase",
  event_started as "Iniciado?",
  event_end_time as "Fim",
  event_ended as "Terminado?"
FROM event_config;
