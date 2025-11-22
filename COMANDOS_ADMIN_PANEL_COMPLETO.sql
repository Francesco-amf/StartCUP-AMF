-- 🎮 COMANDOS COMPLETOS PARA ADMIN PANEL
-- Cole estes comandos no painel de admin conforme necessário

-- ============================================================================
-- 📋 VERIFICAÇÃO RÁPIDA - USE A QUALQUER MOMENTO
-- ============================================================================
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  LEFT(q.name, 30) as "Nome",
  q.status as "Status",
  q.started_at as "Iniciou",
  CASE 
    WHEN q.started_at IS NOT NULL 
    THEN CONCAT(
      ROUND(EXTRACT(EPOCH FROM (q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW())) / 60),
      ' min'
    )
    ELSE '-'
  END as "Tempo Restante"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = (SELECT current_phase FROM event_config LIMIT 1)
ORDER BY q.order_index;

-- ============================================================================
-- ⏰ QUANDO QUEST 2.1 EXPIRAR (~10 minutos)
-- ============================================================================

-- PASSO 1: Fechar Quest 2.1
UPDATE quests SET status = 'closed'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 1;

-- PASSO 2: Ativar Quest 2.2 (30 minutos)
UPDATE quests SET started_at = NOW(), status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 2;

-- PASSO 3: Confirmar
SELECT order_index, LEFT(name, 30), status, started_at 
FROM quests WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) 
AND order_index IN (1,2) ORDER BY order_index;

-- ============================================================================
-- ⏰ QUANDO QUEST 2.2 EXPIRAR (~40 minutos a partir de agora)
-- ============================================================================

-- PASSO 1: Fechar Quest 2.2
UPDATE quests SET status = 'closed'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 2;

-- PASSO 2: Ativar Quest 2.3 (120 minutos)
UPDATE quests SET started_at = NOW(), status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 3;

-- PASSO 3: Confirmar
SELECT order_index, LEFT(name, 30), status, started_at 
FROM quests WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) 
AND order_index IN (2,3) ORDER BY order_index;

-- ============================================================================
-- ⏰ QUANDO QUEST 2.3 EXPIRAR (~160 minutos a partir de agora)
-- ============================================================================

-- PASSO 1: Fechar Quest 2.3
UPDATE quests SET status = 'closed'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 3;

-- PASSO 2: Ativar BOSS 2.4 (25 minutos - apresentação)
UPDATE quests SET started_at = NOW(), status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 4;

-- PASSO 3: Confirmar
SELECT order_index, LEFT(name, 30), status, started_at 
FROM quests WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) 
AND order_index IN (3,4) ORDER BY order_index;

-- ============================================================================
-- 🎯 QUANDO BOSS 2.4 TERMINAR
-- ============================================================================

-- PASSO 1: Fechar BOSS 2.4
UPDATE quests SET status = 'closed'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 4;

-- PASSO 2: O auto_advance_phase VAI RODAR AUTOMATICAMENTE
-- Mas se não rodar, use este comando:

-- Avançar para Fase 3 MANUALMENTE:
UPDATE event_config 
SET current_phase = 3,
    phase_3_start_time = NOW(),
    updated_at = NOW();

-- Ativar Quest 3.1 (primeira quest da Fase 3):
UPDATE quests SET started_at = NOW(), status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3) AND order_index = 1;

-- PASSO 3: Confirmar mudança de fase
SELECT 
  current_phase as "Fase Atual",
  phase_3_start_time as "Fase 3 Iniciou em"
FROM event_config;

SELECT order_index, LEFT(name, 30), status, started_at 
FROM quests WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3) 
AND order_index = 1;

-- ============================================================================
-- 🚨 EMERGÊNCIA: RESETAR QUEST ATUAL
-- ============================================================================

-- Se precisar resetar a quest atual e dar mais tempo:

-- Exemplo: Dar +30 minutos na Quest 2.1
UPDATE quests 
SET started_at = started_at - INTERVAL '30 minutes'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) 
  AND order_index = 1
  AND status = 'active';

-- Verificar novo tempo:
SELECT 
  order_index,
  name,
  ROUND(EXTRACT(EPOCH FROM (started_at + (duration_minutes * INTERVAL '1 minute') - NOW())) / 60) as "Min Restantes"
FROM quests 
WHERE status = 'active';

-- ============================================================================
-- 📊 DASHBOARD COMPLETO - VER TUDO
-- ============================================================================

SELECT 
  ec.current_phase as "Fase Atual",
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome Quest",
  q.status as "Status",
  q.duration_minutes as "Duração",
  CASE 
    WHEN q.started_at IS NOT NULL THEN
      ROUND(EXTRACT(EPOCH FROM (q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW())) / 60)
    ELSE NULL
  END as "Min Restantes",
  CASE 
    WHEN q.status = 'active' THEN '▶️ ATIVA'
    WHEN q.status = 'closed' THEN '✅ Fechada'
    WHEN q.status = 'scheduled' THEN '📅 Aguardando'
    ELSE q.status
  END as "Estado"
FROM event_config ec
CROSS JOIN quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = ec.current_phase
ORDER BY q.order_index;
