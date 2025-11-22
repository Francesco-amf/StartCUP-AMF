-- ⚡ CORRIGIR ESTADO DAS QUESTS E PREPARAR PARA AUTO-ATIVAÇÃO

-- 1️⃣ FECHAR QUEST 2.2 (vai ser reativada automaticamente depois)
UPDATE quests
SET status = 'closed',
    started_at = NULL  -- Limpar started_at para poder ser ativada de novo
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2)
  AND order_index = 2;

-- 2️⃣ CONFIRMAR ESTADO ATUAL
SELECT 
  q.order_index as "Quest#",
  q.name as "Nome",
  q.status as "Status",
  q.started_at IS NOT NULL as "Iniciada?",
  CASE 
    WHEN q.status = 'active' AND q.started_at IS NOT NULL THEN '✅ ATIVA AGORA'
    WHEN q.status = 'closed' AND q.started_at IS NULL THEN '⏳ AGUARDANDO REATIVAÇÃO'
    WHEN q.status = 'closed' THEN '🔒 FECHADA'
    ELSE '❓ ' || q.status
  END as "Estado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- 3️⃣ VER QUANDO QUEST 2.1 VAI EXPIRAR
SELECT 
  q.name as "Quest Ativa",
  q.started_at as "Iniciou",
  q.duration_minutes as "Duração (min)",
  q.started_at + (q.duration_minutes * INTERVAL '1 minute') as "Expira Em",
  NOW() as "Agora",
  ROUND(EXTRACT(EPOCH FROM (
    q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW()
  )) / 60) as "Faltam (min) para Quest 2.2 ativar"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2 AND q.order_index = 1;

-- ============================================================================
-- O QUE VAI ACONTECER:
-- ============================================================================
-- 1. Quest 2.1 está ativa agora (expira em ~36 minutos)
-- 2. Quest 2.2 fechada e resetada (started_at = NULL)
-- 3. Quando Quest 2.1 expirar:
--    - auto_start_next_quest() (cron) detecta que 2.1 expirou
--    - Ativa Quest 2.2 automaticamente (seta started_at = NOW(), status = 'active')
-- 4. Quest 2.2 roda normalmente por 30 minutos
-- 5. Quando 2.2 expirar, Quest 2.3 ativa automaticamente
-- 
-- ⚠️ IMPORTANTE: Precisa REATIVAR o cron job 'auto-start-next-quest-job'!
--    Execute: REATIVAR_AUTO_START_QUEST_JOB.sql
-- ============================================================================
