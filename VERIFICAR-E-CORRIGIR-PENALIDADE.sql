-- ==========================================
-- VERIFICAR E CORRIGIR PENALIDADE DE TESTE
-- ==========================================

-- 1. Verificar se o trigger existe
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'update_late_submission_fields_trigger'
LIMIT 5;

-- 2. Verificar se a função do trigger existe
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'update_late_submission_fields'
LIMIT 1;

-- 3. Ver a submissão que foi avaliada com -5 penalty
-- Procurar por submissões recentes que deveriam ter é_late = TRUE
SELECT
  s.id,
  s.team_id,
  t.name as team_name,
  s.quest_id,
  q.name as quest_name,
  s.submitted_at,
  s.is_late,
  s.late_penalty_applied,
  s.final_points,
  s.status,
  -- Calcular deadline manualmente
  q.started_at,
  q.planned_deadline_minutes,
  (q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL) as calculated_deadline
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.status = 'evaluated'
AND s.final_points = 100  -- A que foi salva com 100 pontos (sem penalty)
ORDER BY s.submitted_at DESC
LIMIT 10;

-- 4. Se a quest NÃO tem started_at ou planned_deadline_minutes configurados:
-- Ver quais quests estão sem esses dados
SELECT
  id,
  name,
  started_at,
  planned_deadline_minutes,
  allow_late_submissions
FROM quests
WHERE started_at IS NULL
OR planned_deadline_minutes IS NULL
OR planned_deadline_minutes = 0
LIMIT 10;

-- 5. CORRIGIR: Se a quest não tiver started_at, marcar manualmente como atrasada
-- IMPORTANTE: Você precisa descobrir QUAL foi a submissão testada
-- Descomente e execute depois de confirmar o ID:

/*
UPDATE submissions
SET
  is_late = TRUE,
  late_minutes = 5,
  late_penalty_applied = 5
WHERE id = 'COLOQUE_ID_AQUI'
AND status = 'evaluated'
AND final_points = 100;

-- Verificar o resultado
SELECT
  s.id,
  s.final_points,
  s.is_late,
  s.late_penalty_applied
FROM submissions s
WHERE id = 'COLOQUE_ID_AQUI';
*/

-- 6. Se a quest está sem started_at, isso é o PROBLEMA!
-- A solução é: ou configurar started_at + planned_deadline_minutes na quest
-- OU marcar manualmente a submissão como is_late = TRUE
