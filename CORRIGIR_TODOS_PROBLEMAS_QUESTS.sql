-- 🔧 CORRIGIR TODOS OS PROBLEMAS ENCONTRADOS

-- 1️⃣ Quest 1.1 - Fechar (está ativa mas deveria estar closed)
UPDATE quests
SET status = 'closed'
WHERE id IN (
  SELECT q.id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1 
    AND q.order_index = 1
    AND q.status = 'active'
);

-- 2️⃣ Quest 2.3 - Sincronizar planned_deadline_minutes com duration_minutes
UPDATE quests
SET planned_deadline_minutes = duration_minutes
WHERE id IN (
  SELECT q.id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 2 
    AND q.order_index = 3
);

-- 3️⃣ Quest 2.2 - Ajustar started_at para aparecer como expirada
UPDATE quests
SET started_at = started_at - INTERVAL '45 minutes'
WHERE id IN (
  SELECT q.id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 2 
    AND q.order_index = 2
    AND q.status = 'closed'
);

-- 4️⃣ GARANTIA: Sincronizar planned_deadline_minutes = duration_minutes em TODAS as quests
UPDATE quests
SET planned_deadline_minutes = duration_minutes
WHERE planned_deadline_minutes IS NULL 
   OR planned_deadline_minutes != duration_minutes;

-- ✅ Verificar resultado
SELECT 
  p.order_index || '.' || q.order_index as "Quest",
  q.name,
  q.status,
  q.duration_minutes as "Duração",
  q.planned_deadline_minutes as "Deadline",
  CASE 
    WHEN q.duration_minutes = q.planned_deadline_minutes THEN '✅ OK'
    ELSE '❌ ERRO'
  END as "Status"
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;
