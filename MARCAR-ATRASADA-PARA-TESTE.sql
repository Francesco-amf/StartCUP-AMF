-- ==========================================
-- MARCAR SUBMISSÃO COMO ATRASADA PARA TESTE
-- ==========================================
-- Use isso quando o trigger está desativado em modo teste
-- Permaneça a avaliação sem penalty será deduzida

-- PASSO 1: Encontrar a submissão mais recente (que você vai avaliar)
SELECT
  s.id,
  s.team_id,
  t.name as team_name,
  s.quest_id,
  q.name as quest_name,
  s.status,
  s.submitted_at,
  s.is_late,
  s.late_penalty_applied
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
LEFT JOIN quests q ON s.quest_id = q.id
WHERE s.status = 'pending'  -- Ainda não foi avaliada
ORDER BY s.submitted_at DESC
LIMIT 5;

-- PASSO 2: ANTES DE AVALIAR, Execute este comando:
-- (Substitua 'SUBMISSION_ID_AQUI' pelo ID que você vai avaliar)

/*
UPDATE submissions
SET
  is_late = TRUE,
  late_minutes = 5,
  late_penalty_applied = 5
WHERE id = 'SUBMISSION_ID_AQUI'
AND status = 'pending';
*/

-- PASSO 3: Agora avalie essa submissão com 100 pontos
-- O código vai descontar -5, resultando em 95 ✅

-- PASSO 4: Verificar resultado
SELECT
  s.id,
  s.final_points,
  s.is_late,
  s.late_penalty_applied,
  s.status,
  t.name
FROM submissions s
LEFT JOIN teams t ON s.team_id = t.id
WHERE s.status = 'evaluated'
AND s.is_late = TRUE
ORDER BY s.submitted_at DESC
LIMIT 5;
