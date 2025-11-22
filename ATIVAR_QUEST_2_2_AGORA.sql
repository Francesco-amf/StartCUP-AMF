-- 🚨 ATIVAR QUEST 2.2 AGORA - NENHUMA QUEST ESTÁ ATIVA!

-- 1️⃣ Fechar Quest 2.1 (garantir que está fechada)
UPDATE quests 
SET status = 'closed'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) 
  AND order_index = 1;

-- 2️⃣ Ativar Quest 2.2 AGORA
UPDATE quests 
SET started_at = NOW(),
    status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) 
  AND order_index = 2;

-- 3️⃣ CONFIRMAR
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "Iniciou",
  ROUND(EXTRACT(EPOCH FROM (
    q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW()
  )) / 60) as "Min Restantes"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- ============================================================================
-- O QUE ACONTECEU:
-- ============================================================================
-- Quest 2.1 expirou e foi fechada automaticamente (ou manualmente)
-- MAS Quest 2.2 não foi ativada!
-- Frontend ainda mostra Quest 2.1 por CACHE
--
-- APÓS EXECUTAR:
-- - Quest 2.2 fica ativa
-- - Todas as equipes dão F5 e verão Quest 2.2
-- ============================================================================
