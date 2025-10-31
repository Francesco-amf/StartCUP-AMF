-- VERIFICAR ESTADO COMPLETO DO EVENTO (ANTES DA MIGRAÇÃO)

-- 1. Estado do evento
SELECT
  'Estado do Evento' as info,
  event_started,
  event_ended,
  current_phase,
  event_start_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Informações da fase atual (baseado em current_phase)
SELECT
  'Fase Atual' as info,
  id,
  phase_number,
  name,
  duration_minutes,
  max_points
FROM phases
WHERE phase_number = (
  SELECT current_phase
  FROM event_config
  WHERE id = '00000000-0000-0000-0000-000000000001'
);

-- 3. Quests da fase atual (baseado em current_phase)
SELECT
  'Quests da Fase' as info,
  q.id,
  q.name,
  q.phase_id,
  q.deliverable_type,
  q.max_points,
  q.order_index
FROM quests q
WHERE q.phase_id = (
  SELECT id
  FROM phases
  WHERE phase_number = (
    SELECT current_phase
    FROM event_config
    WHERE id = '00000000-0000-0000-0000-000000000001'
  )
)
ORDER BY q.order_index;

-- 4. Total de quests cadastradas
SELECT
  'Total de Quests' as info,
  COUNT(*) as total_quests
FROM quests;
