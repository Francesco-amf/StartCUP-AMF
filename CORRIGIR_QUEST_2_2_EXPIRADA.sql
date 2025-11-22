-- 🔧 CORRIGIR QUEST 2.2: Fechar corretamente ajustando started_at

-- Quest 2.2 está 'closed' mas ainda não "expirou" segundo a lógica do dashboard
-- Vamos ajustar started_at para que ela apareça como expirada

UPDATE quests
SET started_at = started_at - INTERVAL '45 minutes'
WHERE id IN (
  SELECT q.id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 2 
    AND q.order_index = 2
    AND q.status = 'closed'
)
RETURNING 
  order_index,
  name,
  status,
  started_at,
  started_at + (planned_deadline_minutes * INTERVAL '1 minute') as "Novo Prazo",
  NOW() as "Agora",
  NOW() > started_at + (planned_deadline_minutes * INTERVAL '1 minute') as "Expirou Agora?";

-- ✅ Quest 2.2 agora está expirada segundo a lógica do dashboard
-- ✅ Dashboard vai pular para Quest 2.3
