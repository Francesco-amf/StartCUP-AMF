-- ⚡ CORRIGIR: Ativar Quest 2.1 e parar Quest 2.2

-- 1️⃣ PARAR Quest 2.2 (que foi ativada por engano)
UPDATE quests
SET status = 'pending',
    started_at = NULL
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 2;

-- 2️⃣ ATIVAR Quest 2.1 (que deveria estar ativa)
UPDATE quests
SET status = 'active',
    started_at = NOW()
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 1
  AND started_at IS NULL;  -- Só ativar se não foi iniciada

-- 3️⃣ CONFIRMAR
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "Iniciada Em",
  CASE 
    WHEN q.order_index = 1 AND q.status = 'active' THEN '✅ CORRIGIDO'
    WHEN q.order_index = 2 AND q.status = 'pending' THEN '✅ PARADO'
    ELSE '⚠️ VERIFICAR'
  END as "Estado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;
