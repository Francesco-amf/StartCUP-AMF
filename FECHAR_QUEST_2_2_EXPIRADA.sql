-- ⚡ FECHAR QUEST 2.2 QUE JÁ EXPIROU

-- 1️⃣ CONFIRMAR QUE 2.2 JÁ EXPIROU
SELECT 
  q.name,
  q.started_at as "Iniciou",
  q.started_at + ((q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute') as "Expirou Em",
  NOW() as "Agora",
  NOW() > (q.started_at + ((q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0)) * INTERVAL '1 minute')) as "Expirou?",
  q.status as "Status Atual"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 AND q.order_index = 2;

-- 2️⃣ FECHAR QUEST 2.2
UPDATE quests
SET status = 'closed'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 2;

-- 3️⃣ CONFIRMAR QUE AGORA SÓ TEM UMA QUEST ATIVA
SELECT 
  q.order_index as "Quest#",
  q.name as "Nome",
  q.status as "Status",
  CASE 
    WHEN q.status = 'active' THEN '✅ ATIVA'
    WHEN q.status = 'closed' THEN '🔒 FECHADA'
    ELSE '⏳ ' || q.status
  END as "Estado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- ============================================================================
-- EXPLICAÇÃO:
-- ============================================================================
-- Quest 2.2 iniciou: 03:28:52
-- Quest 2.2 expirou: 03:58:52 (30min + 15min janela = 45min)
-- Agora são: 03:49
-- 
-- Quest 2.2 JÁ EXPIROU mas estava com status='active'
-- Isso confundiu o frontend que mostrou formulário da 2.2
-- 
-- Agora fechamos a 2.2 e só a 2.1 fica ativa
-- Frontend vai atualizar e mostrar formulário da 2.1 ✅
-- ============================================================================
