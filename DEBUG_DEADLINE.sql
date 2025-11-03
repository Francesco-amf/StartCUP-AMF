-- DEBUG: Verificar dados de deadline das quests
-- Execute isso no Supabase SQL Editor para entender o problema

-- 1. Ver todas as quests ativas com seus deadlines
SELECT
  id,
  name,
  order_index,
  status,
  started_at,
  planned_deadline_minutes,
  late_submission_window_minutes,
  -- Calcular deadline esperado
  (started_at::timestamp + (planned_deadline_minutes || ' minutes')::interval) as expected_deadline,
  -- Tempo restante agora
  EXTRACT(EPOCH FROM ((started_at::timestamp + (planned_deadline_minutes || ' minutes')::interval) - NOW())) / 60 as minutes_remaining_now
FROM quests
WHERE status = 'active'
ORDER BY started_at DESC;

-- 2. Ver diferença de horário (se o servidor está com timezone errado)
SELECT
  NOW() as server_now,
  CURRENT_TIMESTAMP as current_timestamp,
  TIMEZONE(CURRENT_TIMESTAMP) as current_timezone;

-- 3. Ver a quest mais recente com detalhes
SELECT
  q.id,
  q.name,
  q.started_at,
  q.planned_deadline_minutes,
  NOW() as agora,
  -- Diferença em minutos
  EXTRACT(EPOCH FROM (q.started_at - NOW())) / 60 as minutos_desde_inicio,
  -- Tempo até deadline
  EXTRACT(EPOCH FROM ((q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) - NOW())) / 60 as minutos_restantes
FROM quests q
WHERE q.status = 'active'
LIMIT 1;

-- 4. Se o problema for timezone, você pode ver:
-- Datas em UTC
SELECT
  id,
  name,
  started_at AT TIME ZONE 'UTC' as started_at_utc,
  started_at AT TIME ZONE 'America/Sao_Paulo' as started_at_br
FROM quests
WHERE status = 'active'
LIMIT 1;
