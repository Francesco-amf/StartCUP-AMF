-- ⚡ ATIVAÇÃO EMERGENCIAL DO BOSS 1.4
-- Execute AGORA para iniciar o timer do BOSS

-- 1️⃣ VERIFICAR STATUS ATUAL DO BOSS
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "Iniciada Em",
  q.duration_minutes as "Duração (min)",
  CASE 
    WHEN q.started_at IS NULL THEN '❌ NÃO INICIADA'
    ELSE '✅ INICIADA'
  END as "Estado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 
  AND q.order_index = 4;

-- 2️⃣ ATIVAR O BOSS AGORA! ⚡
UPDATE quests
SET 
  status = 'active',
  started_at = NOW()
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 4
  AND started_at IS NULL; -- Só ativar se ainda não foi ativado

-- 3️⃣ CONFIRMAR ATIVAÇÃO
SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.started_at as "Iniciada Em",
  q.started_at + (q.duration_minutes * INTERVAL '1 minute') as "Termina Em",
  CASE 
    WHEN q.started_at IS NOT NULL THEN '✅ BOSS ATIVO!'
    ELSE '❌ ERRO - AINDA NÃO ATIVADO'
  END as "Estado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 
  AND q.order_index = 4;

-- 📝 NOTAS:
-- O timer do BOSS vai aparecer automaticamente na live dashboard
-- O sistema auto_start_next_quest() NÃO ativa BOSS automaticamente (é proteção)
-- BOSS sempre precisa ser ativado manualmente via:
--   - Este script SQL OU
--   - API POST /api/admin/start-quest com { questId: "..." }
