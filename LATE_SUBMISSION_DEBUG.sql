-- ==========================================
-- DEBUG: Late Submission Window Issue
-- ==========================================
-- User reported: "Mesmo estando na janela de 15 min diz que o prazo expirou"
-- Translation: "Even being in the 15 min window, it says deadline expired"
--
-- This diagnostic will help identify why late submissions are being rejected
-- ==========================================

-- QUERY 1: Ver o estado atual da quest 1 da fase 1
-- ==========================================
SELECT
  q.id,
  q.name,
  q.status,
  q.started_at,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  NOW() as agora,
  (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) as deadline_calculado,
  (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) + (q.late_submission_window_minutes || ' minutes')::interval as late_window_end,
  EXTRACT(EPOCH FROM (
    NOW() - (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval)
  ))::INTEGER / 60 as minutos_apos_deadline,
  CASE
    WHEN NOW() < (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) THEN 'No prazo'
    WHEN NOW() < (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) + (q.late_submission_window_minutes || ' minutes')::interval THEN 'Na janela de atraso'
    ELSE 'Passou da janela de atraso'
  END as status_atual
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 1
LIMIT 1;

-- QUERY 2: Testar a função validate_submission_allowed para team Alpha
-- ==========================================
-- Primeiro, encontre o ID da quest 1 da fase 1 e team Alpha
WITH quest_info AS (
  SELECT q.id as quest_id, t.id as team_id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  JOIN teams t ON t.name = 'Equipe Alpha'
  WHERE p.order_index = 1 AND q.order_index = 1
  LIMIT 1
)
SELECT
  -- Resultado da função
  (validate_submission_allowed(
    (SELECT team_id FROM quest_info),
    (SELECT quest_id FROM quest_info)
  )).*,
  -- Informações da quest para contexto
  (SELECT quest_id FROM quest_info) as quest_id_testado,
  (SELECT team_id FROM quest_info) as team_id_testado;

-- QUERY 3: Ver situação detalhada de deadline vs agora
-- ==========================================
WITH quest_data AS (
  SELECT
    q.id,
    q.name,
    q.started_at,
    q.planned_deadline_minutes,
    q.late_submission_window_minutes,
    NOW() as agora,
    (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) as deadline,
    (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) + (q.late_submission_window_minutes || ' minutes')::interval as late_window_end
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1 AND q.order_index = 1
)
SELECT
  quest_data.id,
  quest_data.name,
  quest_data.started_at,
  quest_data.deadline,
  quest_data.late_window_end,
  quest_data.agora,
  CASE
    WHEN quest_data.agora < quest_data.deadline THEN 'ANTES do deadline'
    WHEN quest_data.agora < quest_data.late_window_end THEN 'NA JANELA DE ATRASO'
    ELSE 'APÓS JANELA DE ATRASO'
  END as posicao_temporal,
  EXTRACT(EPOCH FROM (quest_data.agora - quest_data.deadline))::INTEGER / 60 as minutos_apos_deadline,
  EXTRACT(EPOCH FROM (quest_data.late_window_end - quest_data.agora))::INTEGER / 60 as minutos_restantes_na_janela
FROM quest_data;

-- QUERY 4: Checar se há submissão anterior
-- ==========================================
SELECT
  t.name as team,
  q1.name as quest,
  s.id as submission_id,
  s.status,
  s.submitted_at,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q1 ON s.quest_id = q1.id
WHERE t.name = 'Equipe Alpha'
  AND q1.order_index = 1
ORDER BY s.submitted_at DESC;

-- QUERY 5: Ver o valor de 'planned_deadline_minutes' e 'late_submission_window_minutes'
-- ==========================================
SELECT
  q.id,
  q.name,
  p.name as phase,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  q.allow_late_submissions,
  q.status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;

-- QUERY 6: Calcular manualmente minutos de atraso
-- ==========================================
WITH time_calc AS (
  SELECT
    q.started_at,
    q.planned_deadline_minutes,
    q.late_submission_window_minutes,
    NOW() as agora,
    (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) as deadline
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1 AND q.order_index = 1
)
SELECT
  time_calc.started_at,
  time_calc.deadline,
  time_calc.agora,
  EXTRACT(EPOCH FROM (time_calc.agora - time_calc.deadline))::INTEGER as segundos_apos_deadline,
  EXTRACT(EPOCH FROM (time_calc.agora - time_calc.deadline))::INTEGER / 60 as minutos_apos_deadline,
  CASE
    WHEN (EXTRACT(EPOCH FROM (time_calc.agora - time_calc.deadline))::INTEGER / 60) <= 0 THEN 'Sem atraso'
    WHEN (EXTRACT(EPOCH FROM (time_calc.agora - time_calc.deadline))::INTEGER / 60) <= 5 THEN '-5pts'
    WHEN (EXTRACT(EPOCH FROM (time_calc.agora - time_calc.deadline))::INTEGER / 60) <= 10 THEN '-10pts'
    WHEN (EXTRACT(EPOCH FROM (time_calc.agora - time_calc.deadline))::INTEGER / 60) <= 15 THEN '-15pts'
    ELSE 'Bloqueado (>15 min)'
  END as penalidade_esperada
FROM time_calc;

-- ==========================================
-- INTERPRETAÇÃO DOS RESULTADOS
-- ==========================================
-- Query 1: Mostra o estado da quest, se agora está "Na janela de atraso", é problema!
-- Query 2: Testa a função RPC - deve retornar is_allowed = TRUE se na janela
-- Query 3: Mostra posição temporal - se disser "NA JANELA DE ATRASO", lógica está OK
-- Query 4: Vê se equipe já fez submissão anterior
-- Query 5: Verifica se 'planned_deadline_minutes' e 'late_submission_window_minutes' estão corretos
-- Query 6: Calcula manualmente o tempo de atraso

-- ==========================================
-- Se tudo estar correto:
-- - Query 3 deve mostrar: posicao_temporal = 'NA JANELA DE ATRASO'
-- - Query 2 deve retornar: is_allowed = TRUE, reason = 'Submissão atrasada, será aplicada penalidade'
--
-- Se Query 2 retornar is_allowed = FALSE:
-- - Há um bug na função ou nos dados da quest
-- ==========================================
