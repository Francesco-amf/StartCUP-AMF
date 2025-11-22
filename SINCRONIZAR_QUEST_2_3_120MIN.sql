-- 🔧 SINCRONIZAR QUEST 2.3: duration_minutes = 120 (SEM REINICIAR)

-- Apenas atualiza duration_minutes para 120, mantendo started_at original
-- A quest continua rodando normalmente a partir do momento que foi ativada

UPDATE quests
SET duration_minutes = 120
WHERE id IN (
  SELECT q.id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 2 
    AND q.order_index = 3
)
RETURNING 
  order_index as "Quest",
  name as "Nome",
  status as "Status",
  started_at as "Iniciou Em (não muda)",
  duration_minutes as "Duração (atualizada para 120)",
  planned_deadline_minutes as "Deadline Planejado",
  started_at + (duration_minutes * INTERVAL '1 minute') as "Novo Prazo de Expiração";

-- ✅ duration_minutes = 120
-- ✅ planned_deadline_minutes = 120
-- ✅ started_at PERMANECE O MESMO (quest não reinicia)
-- ✅ Sincronizado com live dashboard e timer da fase
