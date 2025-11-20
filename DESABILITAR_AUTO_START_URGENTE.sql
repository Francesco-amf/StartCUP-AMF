-- ==================================================
-- DESABILITAR auto_start_next_quest COMPLETAMENTE
-- ==================================================
-- URGENTE: Está ativando próxima quest quando UMA equipe submete
-- ==================================================

-- 1. DESABILITAR o cron job que executa auto_start_next_quest
SELECT cron.unschedule('auto-start-next-quest-job');

-- 2. Verificar se foi desabilitado
SELECT jobname, active, schedule, command
FROM cron.job
WHERE jobname = 'auto-start-next-quest-job';

-- 3. REVERTER Quest 3.2 para inactive (foi ativada prematuramente)
UPDATE quests q
SET status = 'inactive',
    started_at = NULL
FROM phases p
WHERE q.phase_id = p.id
  AND p.order_index = 3
  AND q.order_index = 2;

-- 4. GARANTIR Quest 3.1 está ativa
UPDATE quests q
SET status = 'active'
FROM phases p
WHERE q.phase_id = p.id
  AND p.order_index = 3
  AND q.order_index = 1;

-- 5. Verificar estado das quests da Fase 3
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
WHERE p.order_index = 3
ORDER BY q.order_index;

-- ==================================================
-- SOLUÇÃO PERMANENTE
-- ==================================================
-- Quests devem ser ativadas MANUALMENTE pelo admin
-- Não deve haver ativação automática baseada em submissões
-- 
-- Para ativar próxima quest manualmente:
-- UPDATE quests SET status = 'active', started_at = NOW() WHERE id = '<quest_id>';
-- ==================================================
