-- ==========================================
-- Verificar quests BOSS e sistema de detecção
-- ==========================================

-- 1. Listar TODAS as quests com order_index = 4 (Bosses)
SELECT 
  '🎯 BOSS QUESTS (order_index=4)' as tipo,
  q.id,
  q.name,
  q.deliverable_type,
  q.order_index,
  q.status,
  q.max_points,
  p.order_index as phase_number,
  p.name as phase_name
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 4
ORDER BY p.order_index;

-- 2. Verificar qual quest está ATIVA agora
SELECT 
  '📍 QUEST ATIVA' as tipo,
  q.id,
  q.name,
  q.deliverable_type,
  q.order_index,
  q.status,
  p.order_index as phase_number,
  p.name as phase_name
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.status = 'active';

-- 3. Verificar próxima quest SCHEDULED na fase atual
SELECT 
  '⏰ PRÓXIMA QUEST (scheduled)' as tipo,
  q.id,
  q.name,
  q.deliverable_type,
  q.order_index,
  q.status,
  q.started_at,
  p.order_index as phase_number,
  p.name as phase_name
FROM quests q
JOIN phases p ON q.phase_id = p.id
JOIN event_config ec ON p.order_index = ec.current_phase
WHERE q.status = 'scheduled'
  AND ec.id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY q.order_index
LIMIT 1;

-- 4. Verificar configuração do evento
SELECT 
  '⚙️ EVENTO CONFIG' as tipo,
  event_started,
  current_phase,
  (SELECT name FROM phases WHERE order_index = current_phase) as phase_name
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- 5. Contar quantas quests estão em cada status na fase atual
SELECT 
  '📊 STATUS DAS QUESTS NA FASE ATUAL' as tipo,
  q.status,
  COUNT(*) as quantidade,
  STRING_AGG(q.name, ', ') as quests
FROM quests q
JOIN phases p ON q.phase_id = p.id
JOIN event_config ec ON p.order_index = ec.current_phase
WHERE ec.id = '00000000-0000-0000-0000-000000000001'::uuid
GROUP BY q.status;
