-- ==========================================
-- DIAGNÓSTICO: Quest 3.1 - Por que penalty = 0
-- ==========================================

-- Encontrar a quest
SELECT
  id,
  name,
  started_at,
  planned_deadline_minutes,
  allow_late_submissions,
  (started_at + (planned_deadline_minutes || ' minutes')::INTERVAL) as deadline
FROM quests
WHERE name ILIKE '%Montando o Exército%'
OR name ILIKE '%Quest 3.1%';

-- Agora calcular manualmente quanto foi atrasada
-- Usando a submissão: a4824d8f-606a-42e3-a831-a3e01124fdbe

SELECT
  s.submitted_at,
  q.started_at,
  q.planned_deadline_minutes,
  (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL) as deadline,
  EXTRACT(EPOCH FROM (s.submitted_at - (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL)))::INTEGER as segundos_atrasada,
  EXTRACT(EPOCH FROM (s.submitted_at - (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL)))::INTEGER / 60 as minutos_atrasada,
  -- Testar a função
  calculate_late_penalty(EXTRACT(EPOCH FROM (s.submitted_at - (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL)))::INTEGER / 60) as penalty_funcao
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.id = 'a4824d8f-606a-42e3-a831-a3e01124fdbe';
