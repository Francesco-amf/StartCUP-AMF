-- ==========================================
-- DIAGNÓSTICO RÁPIDO - Por que a penalidade não foi deduzida
-- ==========================================

-- Procurar pela submissão que foi avaliada com -5 penalty esperado
-- A submissão que você testou deve ter status = 'evaluated' e final_points = 100

WITH recent_evaluations AS (
  SELECT
    s.id,
    s.team_id,
    t.name as team_name,
    s.quest_id,
    q.name as quest_name,
    q.started_at as quest_started_at,
    q.planned_deadline_minutes,
    s.submitted_at,
    s.is_late,
    s.late_penalty_applied,
    s.final_points,
    s.status,
    -- Verificar se deadline pode ser calculado
    CASE
      WHEN q.started_at IS NULL THEN 'QUEST NÃO TEM started_at'
      WHEN q.planned_deadline_minutes IS NULL OR q.planned_deadline_minutes = 0 THEN 'planned_deadline_minutes NÃO CONFIGURADO'
      WHEN s.submitted_at > (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL) THEN 'DEVERIA SER ATRASADA'
      ELSE 'NO PRAZO'
    END as diagnostico,
    -- Calcular o que deveria ser o late_penalty_applied
    CASE
      WHEN q.started_at IS NULL THEN 0
      WHEN s.submitted_at <= (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL) THEN 0
      WHEN EXTRACT(EPOCH FROM (s.submitted_at - (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL)))::INTEGER / 60 <= 5 THEN 5
      WHEN EXTRACT(EPOCH FROM (s.submitted_at - (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL)))::INTEGER / 60 <= 10 THEN 10
      WHEN EXTRACT(EPOCH FROM (s.submitted_at - (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL)))::INTEGER / 60 <= 15 THEN 15
      ELSE 0
    END as penalty_should_be
  FROM submissions s
  LEFT JOIN teams t ON s.team_id = t.id
  LEFT JOIN quests q ON s.quest_id = q.id
  WHERE s.status = 'evaluated'
  ORDER BY s.submitted_at DESC
  LIMIT 20
)
SELECT * FROM recent_evaluations;

-- Se a quest NÃO tem started_at, isso é o PROBLEMA ROOT CAUSE
-- O trigger não consegue calcular o deadline sem started_at
