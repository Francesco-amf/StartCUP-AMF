-- 🔧 CORRIGIR QUEST 2.3 - ESTÁ CLOSED MAS NUNCA FOI INICIADA

-- 1️⃣ Resetar Quest 2.3 para 'scheduled'
UPDATE quests 
SET status = 'scheduled',
    started_at = NULL
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) 
  AND order_index = 3;

-- 2️⃣ Garantir que BOSS 2.4 está 'scheduled' também
UPDATE quests 
SET status = 'scheduled',
    started_at = NULL
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) 
  AND order_index = 4;

-- 3️⃣ CONFIRMAR
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "Iniciou",
  CASE 
    WHEN q.order_index = 2 AND q.status = 'active' THEN '✅ Quest 2.2 ATIVA (rodando agora)'
    WHEN q.order_index = 3 AND q.status = 'scheduled' THEN '✅ Quest 2.3 PRONTA para ativar depois'
    WHEN q.order_index = 4 AND q.status = 'scheduled' THEN '✅ BOSS 2.4 PRONTO para ativar depois'
    WHEN q.status = 'closed' THEN '🔒 Fechada'
    ELSE '❓ Verificar'
  END as "Estado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- ============================================================================
-- SITUAÇÃO ATUAL CORRIGIDA:
-- ============================================================================
-- ✅ Quest 2.1: CLOSED (terminou)
-- ✅ Quest 2.2: ACTIVE (rodando agora - 30min restantes)
-- ✅ Quest 2.3: SCHEDULED (pronta para ativar quando 2.2 terminar)
-- ✅ BOSS 2.4: SCHEDULED (pronto para ativar quando 2.3 terminar)
--
-- QUANDO QUEST 2.2 EXPIRAR (em 30 minutos):
-- Use o botão "▶️ ATIVAR QUEST 3" no admin panel
-- Ou execute: 
-- UPDATE quests SET started_at=NOW(), status='active' 
-- WHERE phase_id=(SELECT id FROM phases WHERE order_index=2) AND order_index=3;
-- ============================================================================
