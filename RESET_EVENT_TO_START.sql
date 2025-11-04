-- ==================================================
-- RESETAR EVENTO PARA ESTADO INICIAL CORRETO
-- ==================================================

-- PASSO 1: Parar auto-advance (se ainda não fez)
SELECT cron.unschedule('auto-advance-phase-job');

-- PASSO 2: Resetar event_config para Fase 1
UPDATE event_config 
SET current_phase = 1,
    updated_at = NOW();

-- PASSO 3: Limpar TODAS as quests (resetar started_at)
-- CUIDADO: Isso vai limpar TODAS as quests de TODAS as fases

UPDATE quests 
SET started_at = NULL,
    status = 'scheduled'
WHERE started_at IS NOT NULL;

-- PASSO 4: Iniciar APENAS Quest 1.1 (primeira da Fase 1)
UPDATE quests 
SET started_at = NOW(),
    status = 'active'
WHERE id = (
  SELECT q.id 
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1
    AND q.order_index = 1
  LIMIT 1
);

-- PASSO 5: Verificar resultado
SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.status,
  q.started_at,
  q.planned_deadline_minutes,
  CASE 
    WHEN q.started_at IS NULL THEN 'Não iniciada'
    ELSE 'ATIVA - expira em ' || 
      EXTRACT(EPOCH FROM (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') - NOW()))/60 || ' min'
  END as info
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- PASSO 6: Confirmar event_config
SELECT 
  current_phase,
  event_started,
  updated_at
FROM event_config;
