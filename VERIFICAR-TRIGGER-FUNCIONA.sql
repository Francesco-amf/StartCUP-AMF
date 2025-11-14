-- ==========================================
-- VERIFICAR SE TRIGGER ESTÁ FUNCIONANDO
-- ==========================================

-- Ver a última submissão recém criada (de teste)
SELECT
  s.id,
  s.submitted_at,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  s.status,
  t.name as team_name,
  q.name as quest_name,
  q.started_at,
  q.planned_deadline_minutes,
  (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL) as deadline,
  -- Calcular se deveria ser atrasada
  CASE
    WHEN s.submitted_at > (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL) THEN 'DEVERIA SER ATRASADA'
    ELSE 'NO PRAZO'
  END as deveria_ser
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.status = 'pending'
OR (s.status = 'evaluated' AND s.submitted_at > NOW() - INTERVAL '5 minutes')
ORDER BY s.submitted_at DESC
LIMIT 10;

-- Se ver "DEVERIA SER ATRASADA" mas is_late = FALSE
-- = TRIGGER NÃO ESTÁ FUNCIONANDO
-- Se ver "DEVERIA SER ATRASADA" e is_late = TRUE
-- = TRIGGER ESTÁ FUNCIONANDO ✅
