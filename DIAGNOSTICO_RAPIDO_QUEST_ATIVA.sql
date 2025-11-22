-- 🔍 DIAGNÓSTICO RÁPIDO - QUAL QUEST ESTÁ ATIVA?

-- 1️⃣ Ver qual quest está realmente ativa no banco
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "Iniciou",
  CASE 
    WHEN q.status = 'active' THEN '✅ ESTA É A QUEST ATIVA'
    WHEN q.status = 'closed' THEN '🔒 Fechada'
    ELSE '📅 Agendada'
  END as "Estado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- 2️⃣ Ver se tem múltiplas quests ativas (BUG!)
SELECT 
  COUNT(*) as "Quests Ativas",
  STRING_AGG(CONCAT(q.order_index, '. ', q.name), ', ') as "Quais"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.status = 'active';

-- ============================================================================
-- SE TIVER 2 QUESTS ATIVAS:
-- ============================================================================
-- Significa que Quest 2.1 e 2.2 estão ambas com status='active'
-- Frontend pega a "primeira" que encontrar (pode variar por cache)
-- 
-- SOLUÇÃO IMEDIATA:
-- UPDATE quests SET status='closed' WHERE phase_id=(SELECT id FROM phases WHERE order_index=2) AND order_index=1;
-- ============================================================================
