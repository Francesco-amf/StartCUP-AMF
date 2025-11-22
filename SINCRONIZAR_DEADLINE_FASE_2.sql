-- 🔧 CORRIGIR TODAS QUESTS DA FASE 2: planned_deadline_minutes = duration_minutes

-- Atualizar todas as quests da Fase 2 para garantir sincronia
UPDATE quests
SET planned_deadline_minutes = duration_minutes
WHERE id IN (
  SELECT q.id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 2
)
RETURNING 
  order_index as "Quest",
  name as "Nome",
  status as "Status",
  duration_minutes as "Duração",
  planned_deadline_minutes as "Deadline Planejado (atualizado)";

-- ✅ Agora todas quests têm planned_deadline_minutes = duration_minutes
-- ✅ Dashboard vai calcular expiração corretamente
-- ✅ Não vai mais mostrar quest errada
