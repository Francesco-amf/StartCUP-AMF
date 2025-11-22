-- ============================================================================
-- MAPA COMPLETO: ONDE A DEADLINE IMPACTA (além de quests.started_at)
-- ============================================================================

-- 1️⃣ BANCO DE DADOS
-- ================================================================

-- Tabela: quests
-- Coluna: started_at (TIMESTAMP WITH TIME ZONE)
-- Cálculo: deadline = started_at + planned_deadline_minutes (minutos)
-- Impacto: Base para TUDO

-- Tabela: submissions  
-- Coluna: quest_deadline (calculado via trigger)
-- Impacto: Armazena a deadline no momento da submissão

-- Tabela: submissions
-- Colunas: is_late, late_minutes, late_penalty_applied
-- Impacto: Marca se a submissão foi tardia

-- 2️⃣ RPC FUNCTIONS (PostgreSQL)
-- ================================================================

-- RPC: validate_submission_allowed()
-- Usa: quests.started_at + planned_deadline_minutes
-- Impacto: CRÍTICO - Permite/bloqueia submissão na janela de atraso

-- RPC: check_previous_quest_submitted()
-- Verifica sequência (não usa deadline diretamente)
-- Mas respeita o resultado de validate_submission_allowed()

-- RPC: calculate_late_penalty()
-- Recebe: SEGUNDOS de atraso após deadline
-- Calcula: penalidade 5/10/15pts, bloqueia se > 15min

-- RPC: calculate_quest_deadline()
-- Usa: quests.started_at + planned_deadline_minutes
-- Retorna: o deadline exato da quest para comparação

-- 3️⃣ FRONTEND - COMPONENTES REACT
-- ================================================================

-- SubmissionDeadlineStatus.tsx
-- Calcula: started_at + planned_deadline_minutes
-- Mostra: timer de contagem regressiva até deadline + late window

-- QuestAutoAdvancer.tsx
-- Calcula: started_at + planned_deadline_minutes
-- Polling: 500ms para detectar quando quest expira e avança

-- SubmissionWrapper.tsx
-- Função: isFullyExpired()
-- Calcula: started_at + planned_deadline_minutes + late_submission_window_minutes

-- PhaseController.tsx
-- Monitora: quests com polling
-- Valida: mudanças em started_at para detectar quando fase muda

-- 4️⃣ APIs (Next.js Routes)
-- ================================================================

-- /api/submissions/create
-- Chama: validate_submission_allowed(team_id, quest_id)
-- Impacto: RPC valida deadline antes de aceitar submissão

-- /api/admin/start-quest
-- Ação: UPDATE quests SET started_at = NOW()
-- Impacto: CRÍTICO - Define o ponto de partida da deadline

-- /api/admin/advance-quest
-- QuestAutoAdvancer: já detectou expiração
-- Impacto: Precisa que started_at esteja correto

-- /api/team/check-updates
-- Inclui: started_at no snapshot
-- Detecta: quando started_at muda (quest iniciada)

-- 5️⃣ FLUXO COMPLETO DE UMA SUBMISSÃO TARDIA
-- ================================================================
-- Equipe submete 45 segundos após deadline regular

-- Passo 1: Frontend (SubmissionForm.tsx)
-- Usuario clica Enviar
-- FormData enviado para /api/submissions/create

-- Passo 2: API (route.ts) 
-- Chama: validate_submission_allowed(teamId, questId)

-- Passo 3: RPC (validate_submission_allowed)
-- SELECT quest WHERE id = questId
-- Calcula deadline = quest.started_at + (planned_deadline_minutes minutos)
-- Calcula late_window_end = deadline + (late_submission_window_minutes minutos)
-- IF NOW() > late_window_end THEN REJECT
-- IF NOW() > deadline THEN
--   v_seconds_late = EXTRACT(EPOCH FROM (NOW() - deadline))
--   v_penalty = calculate_late_penalty(v_seconds_late)
--   IF v_penalty IS NULL THEN REJECT
--   ELSE ALLOW com penalidade

-- Passo 4: API (route.ts)
-- Upload para Supabase Storage
-- INSERT into submissions com valores calculados

-- Passo 5: Trigger (update_late_submission_fields)
-- BEFORE INSERT: calcula late_penalty_applied
-- Marca: NEW.is_late = TRUE
-- Marca: NEW.late_minutes = CEIL(segundos / 60)

-- Passo 6: Frontend (SubmissionWrapper.tsx)
-- Polling: detecta nova submission
-- Atualiza: submittedQuestIds
-- Libera: próxima quest (1.3)

-- 6️⃣ COLUNAS CRÍTICAS POR TABELA
-- ================================================================

-- QUESTS
-- started_at ................. CRÍTICA - Base de tudo
-- planned_deadline_minutes ... CRÍTICA - Calcula deadline regular
-- late_submission_window_minutes IMPORTANTE - Estende janela
-- status ..................... IMPORTANTE - Bloqueia se != active/closed

-- SUBMISSIONS
-- submitted_at .............. CRÍTICA - Compara com deadline
-- is_late ................... Informativo - Resultado da comparação
-- late_minutes .............. Informativo - Quantos minutos atrasou
-- late_penalty_applied ...... CRÍTICA - Penalidade aplicada
-- quest_deadline ............ Auditoria - Deadline no momento

-- 7️⃣ QUERY: VER DEADLINE ATUAL
-- ================================================================
-- Descomente para ver deadline calculada para Quest 1.2:

WITH quest_data AS (
  SELECT 
    id,
    name,
    order_index,
    started_at,
    planned_deadline_minutes,
    late_submission_window_minutes,
    status
  FROM quests
  WHERE order_index = 2
  AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1)
  LIMIT 1
)
SELECT 
  name,
  order_index,
  started_at,
  planned_deadline_minutes,
  late_submission_window_minutes,
  (started_at + (planned_deadline_minutes * INTERVAL '1 minute')) as deadline_regular,
  (started_at + ((planned_deadline_minutes + late_submission_window_minutes) * INTERVAL '1 minute')) as deadline_final,
  NOW() AT TIME ZONE 'UTC' as agora,
  CASE 
    WHEN NOW() <= (started_at + (planned_deadline_minutes * INTERVAL '1 minute')) THEN 'NO PRAZO'
    WHEN NOW() > (started_at + (planned_deadline_minutes * INTERVAL '1 minute')) 
         AND NOW() <= (started_at + ((planned_deadline_minutes + late_submission_window_minutes) * INTERVAL '1 minute')) THEN 'EM ATRASO'
    ELSE 'EXPIRADO'
  END as status_atual
FROM quest_data;
