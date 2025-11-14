-- ==========================================
-- CORRIGIR NA RAIZ: Configurar QUESTS com deadline
-- ==========================================
-- O problema é que o trigger não consegue marcar como atrasada
-- porque as quests não têm started_at + planned_deadline_minutes

-- PASSO 1: Ver quais quests têm problemas
SELECT
  id,
  name,
  started_at,
  planned_deadline_minutes,
  allow_late_submissions,
  CASE
    WHEN started_at IS NULL THEN '❌ SEM started_at'
    WHEN planned_deadline_minutes IS NULL THEN '❌ SEM planned_deadline_minutes'
    WHEN planned_deadline_minutes = 0 THEN '❌ planned_deadline_minutes = 0'
    ELSE '✅ CONFIGURADA'
  END as status
FROM quests
ORDER BY id DESC;

-- PASSO 2: Configurar quests com deadline de 30 minutos
-- (ou o tempo que você achar apropriado)
-- Se a quest tem started_at NULL, usar AGORA - 1 hora como referência

UPDATE quests
SET
  started_at = CASE
    WHEN started_at IS NULL THEN NOW() - INTERVAL '1 hour'
    ELSE started_at
  END,
  planned_deadline_minutes = CASE
    WHEN planned_deadline_minutes IS NULL OR planned_deadline_minutes = 0 THEN 30  -- 30 minutos de deadline
    ELSE planned_deadline_minutes
  END,
  allow_late_submissions = TRUE
WHERE started_at IS NULL
OR planned_deadline_minutes IS NULL
OR planned_deadline_minutes = 0;

-- PASSO 3: Verificar resultado
SELECT
  id,
  name,
  started_at,
  planned_deadline_minutes,
  (started_at + (planned_deadline_minutes || ' minutes')::INTERVAL) as deadline,
  allow_late_submissions
FROM quests
ORDER BY id DESC
LIMIT 10;

-- PASSO 4: Se houver submissões DEPOIS da submissão de teste
-- que foram criadas depois do started_at da quest
-- elas agora DEVEM ser marcadas como atrasadas automaticamente
-- pelo trigger quando forem criadas

-- PASSO 5: Para submissões já existentes, marcar manualmente se forem atrasadas
UPDATE submissions s
SET
  is_late = TRUE,
  late_minutes = EXTRACT(EPOCH FROM (s.submitted_at - (
    SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
    FROM quests q WHERE q.id = s.quest_id
  )))::INTEGER / 60,
  late_penalty_applied = CASE
    WHEN EXTRACT(EPOCH FROM (s.submitted_at - (
      SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
      FROM quests q WHERE q.id = s.quest_id
    )))::INTEGER / 60 <= 5 THEN 5
    WHEN EXTRACT(EPOCH FROM (s.submitted_at - (
      SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
      FROM quests q WHERE q.id = s.quest_id
    )))::INTEGER / 60 <= 10 THEN 10
    WHEN EXTRACT(EPOCH FROM (s.submitted_at - (
      SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
      FROM quests q WHERE q.id = s.quest_id
    )))::INTEGER / 60 <= 15 THEN 15
    ELSE 0
  END
WHERE s.submitted_at > (
  SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
  FROM quests q WHERE q.id = s.quest_id
)
AND s.is_late = FALSE;

-- PASSO 6: Para submissões que já foram avaliadas mas não tiveram penalty deduzida
-- Recalcular final_points
UPDATE submissions s
SET final_points = final_points - late_penalty_applied
WHERE s.is_late = TRUE
AND s.late_penalty_applied > 0
AND s.status = 'evaluated'
AND s.final_points + late_penalty_applied <> s.final_points;  -- Já não foi deduzida

-- PASSO 7: Verificar resultado
SELECT
  'SUBMISSIONS ATRASADAS' as tipo,
  s.id,
  s.is_late,
  s.late_penalty_applied,
  s.final_points,
  s.status,
  t.name as team_name
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE s.is_late = TRUE
AND s.status = 'evaluated'
ORDER BY s.submitted_at DESC
LIMIT 20;
