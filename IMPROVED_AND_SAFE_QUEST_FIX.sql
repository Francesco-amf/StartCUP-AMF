-- =================================================================
-- SCRIPT MELHORADO E SEGURO PARA CORRIGIR CONFIGURAÇÃO DE QUESTS
-- =================================================================
-- OBJETIVO: Corrigir quests sem `started_at` ou `planned_deadline_minutes`
-- e ajustar as submissões atrasadas de forma segura e idempotente.
-- IDEMPOTENTE: Seguro para executar múltiplas vezes.
-- =================================================================

BEGIN; -- Inicia uma transação. Se algo der errado, podemos reverter tudo.

-- PASSO 1: Diagnóstico (Apenas Leitura)
-- Identificar as quests que serão corrigidas.
SELECT
  id,
  name,
  phase_id,
  started_at,
  planned_deadline_minutes,
  CASE
    WHEN started_at IS NULL THEN '⚠️ SEM started_at (será corrigido)'
    WHEN planned_deadline_minutes IS NULL OR planned_deadline_minutes = 0 THEN '⚠️ SEM deadline (será corrigido)'
    ELSE '✅ OK'
  END as status_correcao
FROM quests
WHERE started_at IS NULL OR planned_deadline_minutes IS NULL OR planned_deadline_minutes = 0
ORDER BY id DESC;


-- PASSO 2: Corrigir as Quests na Raiz
-- Define valores padrão seguros para `started_at` e `planned_deadline_minutes`.
-- LÓGICA:
-- 1. Se `started_at` for nulo, usa a data de criação da quest (`inserted_at`) como um padrão estável.
-- 2. Se `planned_deadline_minutes` for nulo ou zero, define um padrão de 30 minutos.
--    (AJUSTE ESTE VALOR SE NECESSÁRIO PARA QUESTS ESPECÍFICAS DEPOIS).
-- 3. Habilita `allow_late_submissions` para garantir que o fluxo de atraso funcione.
UPDATE quests
SET
  started_at = COALESCE(started_at, inserted_at),
  planned_deadline_minutes = COALESCE(NULLIF(planned_deadline_minutes, 0), 30),
  allow_late_submissions = TRUE
WHERE
  started_at IS NULL OR planned_deadline_minutes IS NULL OR planned_deadline_minutes = 0;


-- PASSO 3: Marcar Submissões Existentes como Atrasadas (Forma Otimizada)
-- Atualiza as submissões que foram entregues após o deadline recém-configurado.
-- Esta versão é mais eficiente e segura que a original.
WITH quest_deadlines AS (
  SELECT
    id as quest_id,
    (started_at + (planned_deadline_minutes || ' minutes')::INTERVAL) as deadline
  FROM quests
  WHERE planned_deadline_minutes > 0 AND started_at IS NOT NULL
)
UPDATE submissions s
SET
  is_late = TRUE,
  late_minutes = EXTRACT(EPOCH FROM (s.submitted_at - qd.deadline)) / 60,
  -- A lógica de penalidade foi mantida como no script original.
  -- O ideal seria ter uma função para isso, mas para manter a consistência, replicamos aqui.
  late_penalty_applied = CASE
    WHEN (EXTRACT(EPOCH FROM (s.submitted_at - qd.deadline)) / 60) <= 5 THEN 5
    WHEN (EXTRACT(EPOCH FROM (s.submitted_at - qd.deadline)) / 60) <= 10 THEN 10
    WHEN (EXTRACT(EPOCH FROM (s.submitted_at - qd.deadline)) / 60) <= 15 THEN 15
    ELSE 0 -- Ou outra penalidade máxima
  END
FROM quest_deadlines qd
WHERE
  s.quest_id = qd.quest_id
  AND s.submitted_at > qd.deadline
  AND s.is_late = FALSE; -- Apenas atualiza as que ainda não foram marcadas como atrasadas.


-- PASSO 4: Recalcular Pontuação Final (Forma Segura e Idempotente)
-- Recalcula a pontuação final para submissões avaliadas e atrasadas,
-- subtraindo a penalidade da média das notas das avaliações.
-- Isso evita o bug de dupla dedução de penalidade.
WITH evaluation_avg_scores AS (
  SELECT
    submission_id,
    AVG(score) as avg_score
  FROM evaluations
  GROUP BY submission_id
)
UPDATE submissions s
SET
  final_points = COALESCE(eas.avg_score, 0) - COALESCE(s.late_penalty_applied, 0)
FROM
  evaluation_avg_scores eas
WHERE
  s.id = eas.submission_id
  AND s.is_late = TRUE
  AND s.status = 'evaluated'
  -- Apenas atualiza se a pontuação atual estiver incorreta.
  AND s.final_points != (COALESCE(eas.avg_score, 0) - COALESCE(s.late_penalty_applied, 0));


-- PASSO 5: Verificação Final (Apenas Leitura)
-- Confirma que as submissões atrasadas e avaliadas têm a pontuação e penalidade corretas.
SELECT
  s.id as submission_id,
  q.name as quest_name,
  t.name as team_name,
  s.status,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  s.final_points
FROM submissions s
JOIN quests q ON s.quest_id = q.id
JOIN teams t ON s.team_id = t.id
WHERE s.is_late = TRUE AND s.status = 'evaluated'
ORDER BY s.submitted_at DESC
LIMIT 20;

-- Se tudo parece correto após a verificação, descomente a linha abaixo para confirmar as mudanças.
-- COMMIT;

-- Se algo deu errado, descomente a linha abaixo para reverter tudo.
-- ROLLBACK;
