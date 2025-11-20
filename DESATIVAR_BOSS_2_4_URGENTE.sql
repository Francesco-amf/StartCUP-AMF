-- ==================================================
-- DESATIVAR Boss 2.4 que foi ativado prematuramente
-- ==================================================

-- 1. Desativar o Boss
UPDATE quests
SET status = 'inactive',
    started_at = NULL
WHERE id = 'cef5537c-9e73-48e0-809a-bddad6177d98';

-- 2. Verificar se desativou
SELECT 
  id,
  name,
  order_index,
  status,
  started_at
FROM quests
WHERE id = 'cef5537c-9e73-48e0-809a-bddad6177d98';

-- ✅ Boss 2.4 agora está inativo novamente
-- ✅ Ele só será ativado quando você quiser (manualmente)
