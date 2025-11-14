-- ==========================================
-- CORRIGIR LÓGICA DE PENALTY NO UPDATE
-- ==========================================
-- O problema: no PASSO 5 de CORRIGIR-RAIZ-QUESTS.sql
-- a lógica com ELSE 0 está errada
-- quando late_minutes > 15, deveria ser 0 (não permitido) ou simplesmente não atualizar

-- Solução: Re-executar PASSO 5 com lógica corrigida

-- PASSO 5 CORRIGIDO: Marcar submissões já existentes como atrasadas
UPDATE submissions s
SET
  is_late = TRUE,
  late_minutes = EXTRACT(EPOCH FROM (s.submitted_at - (
    SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
    FROM quests q WHERE q.id = s.quest_id
  )))::INTEGER / 60,
  late_penalty_applied = (
    SELECT calculate_late_penalty(
      EXTRACT(EPOCH FROM (s.submitted_at - (
        SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
        FROM quests q WHERE q.id = s.quest_id
      )))::INTEGER / 60
    )
  )
WHERE s.submitted_at > (
  SELECT q.started_at + (q.planned_deadline_minutes || ' minutes')::INTERVAL
  FROM quests q WHERE q.id = s.quest_id
)
AND s.is_late = FALSE;

-- PASSO 6 CORRIGIDO: Recalcular final_points para submissões avaliadas
UPDATE submissions s
SET final_points = final_points - COALESCE(s.late_penalty_applied, 0)
WHERE s.is_late = TRUE
AND s.late_penalty_applied > 0
AND s.status = 'evaluated'
AND (final_points + COALESCE(s.late_penalty_applied, 0)) > final_points;  -- Só se ainda não foi deduzida

-- Verificar resultado
SELECT
  'APÓS CORRIGIR' as etapa,
  s.id,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  s.final_points,
  s.status,
  t.name as team_name
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE s.is_late = TRUE
ORDER BY s.submitted_at DESC
LIMIT 10;
