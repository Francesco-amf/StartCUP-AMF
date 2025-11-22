-- 🔧 ATUALIZAR DURAÇÃO DO BOSS 2.4 PARA 10 MINUTOS

-- BOSS 2.4 deve ter 10 minutos, não 25 minutos

UPDATE quests
SET duration_minutes = 10
WHERE id IN (
  SELECT q.id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 2 
    AND q.order_index = 4
)
RETURNING 
  order_index as "Quest",
  name as "Nome",
  duration_minutes as "Nova Duração (min)",
  status as "Status";

-- ✅ BOSS 2.4 agora tem 10 minutos de duração
