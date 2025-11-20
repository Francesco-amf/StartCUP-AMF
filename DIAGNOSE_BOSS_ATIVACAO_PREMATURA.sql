-- ==================================================
-- DIAGNÓSTICO: Boss ativando prematuramente após Quest 2.3
-- ==================================================
-- Data: 2025-11-20
-- Problema: Submeti Quest 2.3 e Boss (2.4) foi ativado no live dash
-- ==================================================

-- 1. Ver estado atual das quests da Fase 2
SELECT 
  q.id,
  q.name,
  q.order_index,
  q.status,
  q.started_at,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  -- Calcular se expirou
  CASE 
    WHEN q.started_at IS NULL THEN 'Não iniciada'
    WHEN q.planned_deadline_minutes IS NULL THEN 'Sem prazo'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN 'Expirada'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN 'Em atraso'
    ELSE 'No prazo'
  END as deadline_status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- 2. Ver submissões da Quest 2.3
SELECT 
  s.id,
  t.name as team_name,
  s.submitted_at,
  s.status,
  s.final_points
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quests q ON s.quest_id = q.id
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
  AND q.order_index = 3
ORDER BY s.submitted_at DESC;

-- 3. Verificar quantas equipes existem vs quantas submeteram Quest 2.3
SELECT 
  'Total de Equipes' as metric,
  COUNT(*) as count
FROM teams
WHERE id NOT IN (
  SELECT id FROM teams WHERE name IN ('Admin Team', 'Test Team')
)

UNION ALL

SELECT 
  'Submissões Quest 2.3' as metric,
  COUNT(DISTINCT s.team_id) as count
FROM submissions s
JOIN quests q ON s.quest_id = q.id
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
  AND q.order_index = 3;

-- 4. Ver logs recentes da função auto_start_next_quest
-- (verificar se ela foi executada recentemente)
SELECT 
  j.jobid,
  j.jobname,
  j.schedule,
  j.active,
  j.command
FROM cron.job j
WHERE j.jobname = 'auto-start-next-quest-job'
ORDER BY j.jobid DESC
LIMIT 5;

-- 5. Verificar se Boss (Quest 2.4) foi ativado
SELECT 
  q.id,
  q.name,
  q.order_index,
  q.status,
  q.started_at,
  q.deliverable_type
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
  AND q.order_index = 4;

-- ==================================================
-- ANÁLISE
-- ==================================================
-- A função auto_start_next_quest() ATIVA a próxima quest quando:
-- 1. Quest atual EXPIROU (prazo + janela de atraso passou)
-- 2. OU Quest atual foi SUBMETIDA (por QUALQUER equipe)
--
-- PROBLEMA IDENTIFICADO:
-- - Linha 86 de auto-start-next-quest.sql:
--   SELECT EXISTS(SELECT 1 FROM submissions WHERE quest_id = v_current_quest_id) INTO v_current_quest_submitted;
-- - Isso verifica se EXISTE submissão, não se TODAS as equipes submeteram
-- - Então quando UMA equipe submete Quest 2.3, o sistema já ativa Quest 2.4 (Boss)
--
-- SOLUÇÃO:
-- A função auto_start_next_quest() deve continuar funcionando assim (ativar ao expirar ou submeter)
-- MAS o Boss (presentation type) NÃO deve ser ativado automaticamente
-- Boss deve ser ativado MANUALMENTE pelo admin
-- ==================================================
