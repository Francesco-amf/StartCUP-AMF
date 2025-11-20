-- ==================================================
-- DESATIVAR Boss 2.4 que foi ativado prematuramente
-- ==================================================

-- 1. Desativar o Boss COMPLETAMENTE
UPDATE quests
SET status = 'inactive',
    started_at = NULL
WHERE id = 'cef5537c-9e73-48e0-809a-bddad6177d98';

-- 2. Garantir que Quest 2.3 ainda está ativa
UPDATE quests q
SET status = 'active'
FROM phases p
WHERE q.phase_id = p.id
  AND p.order_index = 2
  AND q.order_index = 3;

-- 3. Verificar estado final das quests da Fase 2
SELECT 
  q.id,
  q.name,
  q.order_index,
  q.status,
  q.started_at,
  CASE 
    WHEN q.started_at IS NULL THEN 'NÃO INICIADA'
    WHEN q.status = 'active' THEN 'ATIVA'
    ELSE 'INATIVA'
  END as estado_visual
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- ✅ Boss 2.4 agora está COMPLETAMENTE inativo
-- ✅ Quest 2.3 garantida como ativa
-- ✅ Ele só será ativado quando você quiser (manualmente)
