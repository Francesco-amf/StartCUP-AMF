-- 🎮 COMANDOS MANUAIS PARA ATIVAR PRÓXIMAS QUESTS
-- Use estes comandos conforme as quests vão expirando

-- ============================================================================
-- ⏰ QUANDO QUEST 2.1 EXPIRAR (~10 minutos a partir de agora)
-- ============================================================================

-- 1️⃣ FECHAR Quest 2.1
UPDATE quests
SET status = 'closed'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 1;

-- 2️⃣ ATIVAR Quest 2.2 (30 minutos)
UPDATE quests
SET started_at = NOW(),
    status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 2;

-- 3️⃣ CONFIRMAR
SELECT order_index, name, status, started_at 
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 AND q.order_index IN (1,2);

-- ============================================================================
-- ⏰ QUANDO QUEST 2.2 EXPIRAR (~40 minutos a partir de agora)
-- ============================================================================

-- 1️⃣ FECHAR Quest 2.2
UPDATE quests
SET status = 'closed'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 2;

-- 2️⃣ ATIVAR Quest 2.3 (120 minutos)
UPDATE quests
SET started_at = NOW(),
    status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 3;

-- 3️⃣ CONFIRMAR
SELECT order_index, name, status, started_at 
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 AND q.order_index IN (2,3);

-- ============================================================================
-- ⏰ QUANDO QUEST 2.3 EXPIRAR (~160 minutos a partir de agora)
-- ============================================================================

-- 1️⃣ FECHAR Quest 2.3
UPDATE quests
SET status = 'closed'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 3;

-- 2️⃣ ATIVAR BOSS 2.4 (25 minutos - apresentação)
UPDATE quests
SET started_at = NOW(),
    status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 4;

-- 3️⃣ CONFIRMAR
SELECT order_index, name, status, started_at 
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 AND q.order_index IN (3,4);

-- ============================================================================
-- ⏰ QUANDO BOSS 2.4 TERMINAR
-- ============================================================================
-- O sistema auto_advance_phase VAI AVANÇAR AUTOMATICAMENTE para Fase 3
-- E VAI ATIVAR Quest 3.1 automaticamente (se não tiver o mesmo bug)
--
-- Se a Quest 3.1 não ativar sozinha, use:
-- UPDATE quests SET started_at=NOW(), status='active' 
-- WHERE phase_id=(SELECT id FROM phases WHERE order_index=3) AND order_index=1;
-- ============================================================================

-- ⚡ VERIFICAÇÃO RÁPIDA A QUALQUER MOMENTO:
SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.status,
  ROUND(EXTRACT(EPOCH FROM (q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW())) / 60) as min_restantes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.status = 'active';
