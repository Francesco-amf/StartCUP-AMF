-- 🚨 EMERGÊNCIA: SISTEMA PULOU PARA QUEST 2.3!
-- VOLTAR PARA QUEST 2.1 COM 10 MINUTOS

-- 1️⃣ FECHAR Quest 2.3 (que está ativa errada)
UPDATE quests
SET status = 'closed',
    started_at = NULL
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 3;

-- 2️⃣ FECHAR Quest 2.2 
UPDATE quests
SET status = 'closed',
    started_at = NULL
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 2;

-- 3️⃣ ATIVAR Quest 2.1 com 10 minutos restantes
-- Quest 2.1: 50min duração, para ter 10min restantes = NOW() - 40min
UPDATE quests
SET started_at = NOW() - INTERVAL '40 minutes',
    status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 1;

-- 4️⃣ DESATIVAR O CRON auto-start-next-quest-job (URGENTE!)
-- Ele está pulando quests!
SELECT cron.unschedule('auto-start-next-quest-job');

-- 5️⃣ VERIFICAR
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "Iniciou",
  CASE 
    WHEN q.started_at IS NOT NULL 
    THEN ROUND(EXTRACT(EPOCH FROM (
      q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW()
    )) / 60) 
    ELSE NULL 
  END as "Min Restantes",
  CASE 
    WHEN q.status = 'active' AND q.order_index = 1 THEN '✅ Quest 2.1 ATIVA com 10min!'
    WHEN q.status = 'closed' AND q.order_index IN (2,3) THEN '✅ Fechada'
    ELSE '⚠️ Verificar'
  END as "Resultado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- ============================================================================
-- CRÍTICO: CRON DESATIVADO!
-- ============================================================================
-- O auto-start-next-quest-job está com BUG e pulando quests
-- Desativamos ele até corrigir a lógica
-- Você vai precisar ativar as próximas quests MANUALMENTE por enquanto
-- ============================================================================
