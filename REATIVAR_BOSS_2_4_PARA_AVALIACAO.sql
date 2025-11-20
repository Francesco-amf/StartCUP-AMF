-- ==================================================
-- REATIVAR Boss 2.4 para Avaliação (após expirar)
-- ==================================================

-- 1. Ver estado atual do Boss 2.4
SELECT 
  id,
  name,
  order_index,
  status,
  started_at,
  planned_deadline_minutes,
  CASE 
    WHEN started_at IS NOT NULL THEN
      started_at + (COALESCE(planned_deadline_minutes, 10) * INTERVAL '1 minute')
    ELSE NULL
  END as deadline_calculado
FROM quests
WHERE id = 'cef5537c-9e73-48e0-809a-bddad6177d98';

-- 2. REATIVAR Boss 2.4 com status = 'closed' para permitir avaliação
-- (closed = expirado mas ainda avaliável)
UPDATE quests
SET status = 'closed'
WHERE id = 'cef5537c-9e73-48e0-809a-bddad6177d98';

-- 3. Se started_at estiver NULL, definir como há 15 minutos atrás
-- (para simular que Boss aconteceu recentemente)
UPDATE quests
SET started_at = NOW() - INTERVAL '15 minutes'
WHERE id = 'cef5537c-9e73-48e0-809a-bddad6177d98'
  AND started_at IS NULL;

-- 4. Verificar se Boss agora aparece para avaliadores
SELECT 
  id,
  name,
  status,
  started_at,
  planned_deadline_minutes,
  -- Verificar se está dentro da janela de 2 horas
  EXTRACT(EPOCH FROM (NOW() - started_at)) / 3600 as horas_desde_inicio
FROM quests
WHERE id = 'cef5537c-9e73-48e0-809a-bddad6177d98';

-- ✅ Boss 2.4 agora deve aparecer em /evaluate/boss
-- ✅ Status = 'closed' indica que expirou mas é avaliável
-- ✅ started_at dentro de 2 horas permite avaliação
