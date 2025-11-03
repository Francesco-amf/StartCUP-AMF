-- ==========================================
-- CHECK: started_at Timestamp Issue
-- ==========================================
-- The issue is that "Passou da janela" (past the window)
-- This means started_at + 30 min + 15 min is in the PAST
-- So started_at is probably too old
-- ==========================================

-- QUERY 1: See the actual started_at timestamp
SELECT
  q.id,
  q.name,
  q.status,
  q.started_at,
  NOW() as agora,
  EXTRACT(EPOCH FROM (NOW() - q.started_at)) / 60 as minutos_desde_inicio,
  (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) as deadline,
  EXTRACT(EPOCH FROM (NOW() - (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval))) / 60 as minutos_apos_deadline,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval))) / 60 > 15 THEN 'PASSOU DA JANELA (>15 min atrás)'
    WHEN EXTRACT(EPOCH FROM (NOW() - (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval))) / 60 > 0 THEN 'NA JANELA DE ATRASO'
    ELSE 'NO PRAZO'
  END as status_deadline
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 1;

-- QUERY 2: Check if started_at is way in the past
-- If minutos_desde_inicio is MUCH more than 30-45 minutes, that's the bug!
SELECT
  q.id,
  q.name,
  q.started_at,
  NOW() as agora,
  EXTRACT(EPOCH FROM (NOW() - q.started_at)) / 60 as minutos_desde_que_comecou,
  EXTRACT(EPOCH FROM (NOW() - q.started_at)) / 3600 as horas_desde_que_comecou,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - q.started_at)) / 3600 > 3 THEN '⚠️ MUITO TEMPO! (>3 horas) - Bug de timezone?'
    WHEN EXTRACT(EPOCH FROM (NOW() - q.started_at)) / 3600 < 0 THEN '❌ No futuro! (relógio errado?)'
    ELSE '✅ Parece OK'
  END as diagnostico
FROM quests q
WHERE q.status = 'active' AND q.order_index = 1;

-- QUERY 3: Compare with system time
-- Show exactly how old the started_at is
SELECT
  NOW() as tempo_agora,
  (SELECT started_at FROM quests WHERE status = 'active' AND order_index = 1 LIMIT 1) as quest_started_at,
  EXTRACT(EPOCH FROM (NOW() - (SELECT started_at FROM quests WHERE status = 'active' AND order_index = 1 LIMIT 1))) / 60 as minutos_de_diferenca;
