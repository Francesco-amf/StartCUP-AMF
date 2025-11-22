-- ============================================================================
-- VERIFICAÇÃO APROFUNDADA: Quest 1.2 - Submissões em Prazo Normal e Atraso
-- ============================================================================
-- Este script verifica:
-- 1. Status atual da Quest 1.2
-- 2. Todas as equipes e seus prazos
-- 3. Janelas de atraso por equipe
-- 4. Validação de submissões possíveis agora
-- 5. Simulação de submissões nas próximas horas
-- ============================================================================

-- PASSO 1: VISÃO GERAL DA QUEST 1.2
-- ================================================================
WITH quest_1_2 AS (
  SELECT 
    id,
    name,
    order_index,
    phase_id,
    status,
    started_at,
    planned_deadline_minutes,
    late_submission_window_minutes,
    allow_late_submissions
  FROM quests
  WHERE order_index = 2
  AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1)
  LIMIT 1
)
SELECT 
  '1. QUEST 1.2 - STATUS ATUAL' as secao,
  name,
  status,
  started_at,
  planned_deadline_minutes,
  late_submission_window_minutes,
  (started_at + (planned_deadline_minutes * INTERVAL '1 minute')) as deadline_regular,
  (started_at + ((planned_deadline_minutes + late_submission_window_minutes) * INTERVAL '1 minute')) as deadline_final,
  NOW() AT TIME ZONE 'UTC' as agora_utc,
  CASE 
    WHEN NOW() <= (started_at + (planned_deadline_minutes * INTERVAL '1 minute')) THEN '✅ PRAZO NORMAL'
    WHEN NOW() > (started_at + (planned_deadline_minutes * INTERVAL '1 minute')) 
         AND NOW() <= (started_at + ((planned_deadline_minutes + late_submission_window_minutes) * INTERVAL '1 minute')) THEN '⚠️ JANELA ATRASO'
    ELSE '🚫 EXPIRADO'
  END as status_prazo
FROM quest_1_2;

-- PASSO 2: ANÁLISE DE TODAS AS EQUIPES
-- ================================================================
WITH quest_1_2 AS (
  SELECT 
    id,
    started_at,
    planned_deadline_minutes,
    late_submission_window_minutes
  FROM quests
  WHERE order_index = 2
  AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1)
  LIMIT 1
),
team_deadlines AS (
  SELECT 
    t.id as team_id,
    t.name as team_name,
    q.started_at,
    q.planned_deadline_minutes,
    q.late_submission_window_minutes,
    (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) as deadline_regular,
    (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) as deadline_final,
    NOW() AT TIME ZONE 'UTC' as agora,
    (
      SELECT COUNT(*) 
      FROM submissions s 
      WHERE s.team_id = t.id 
      AND s.quest_id = q.id
    ) as submission_count
  FROM teams t
  CROSS JOIN quest_1_2 q
)
SELECT 
  '2. ANÁLISE POR EQUIPE' as secao,
  team_name,
  CASE 
    WHEN submission_count > 0 THEN '✅ JÁ SUBMETEU'
    WHEN agora <= deadline_regular THEN '⏰ PODE SUBMETER (prazo normal)'
    WHEN agora > deadline_regular AND agora <= deadline_final THEN '⚠️ PODE SUBMETER (com atraso/penalidade)'
    ELSE '🚫 NÃO PODE SUBMETER (expirado)'
  END as status_submissao,
  EXTRACT(EPOCH FROM (deadline_regular - agora))::INTEGER / 60 as minutos_ate_regular,
  EXTRACT(EPOCH FROM (deadline_final - agora))::INTEGER / 60 as minutos_ate_final,
  submission_count
FROM team_deadlines
ORDER BY team_name;

-- PASSO 3: SIMULAÇÃO - Submissões possíveis em 5 timesteps
-- ================================================================
WITH quest_1_2 AS (
  SELECT 
    id,
    started_at,
    planned_deadline_minutes,
    late_submission_window_minutes
  FROM quests
  WHERE order_index = 2
  AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1)
  LIMIT 1
)
SELECT 
  '3. SIMULAÇÃO: Possibilidade de Submissão' as secao,
  'T+0 (AGORA)' as timeline,
  CASE 
    WHEN NOW() <= (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '✅ Prazo Normal'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) 
         AND NOW() <= (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) THEN '⚠️ Janela Atraso'
    ELSE '🚫 Expirado'
  END as status
FROM quest_1_2 q
UNION ALL
SELECT '3. SIMULAÇÃO: Possibilidade de Submissão', 'T+5min',
  CASE 
    WHEN NOW() + INTERVAL '5 minutes' <= (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '✅ Prazo Normal'
    WHEN NOW() + INTERVAL '5 minutes' > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) 
         AND NOW() + INTERVAL '5 minutes' <= (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) THEN '⚠️ Janela Atraso'
    ELSE '🚫 Expirado'
  END
FROM quest_1_2 q
UNION ALL
SELECT '3. SIMULAÇÃO: Possibilidade de Submissão', 'T+15min',
  CASE 
    WHEN NOW() + INTERVAL '15 minutes' <= (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '✅ Prazo Normal'
    WHEN NOW() + INTERVAL '15 minutes' > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) 
         AND NOW() + INTERVAL '15 minutes' <= (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) THEN '⚠️ Janela Atraso'
    ELSE '🚫 Expirado'
  END
FROM quest_1_2 q
UNION ALL
SELECT '3. SIMULAÇÃO: Possibilidade de Submissão', 'T+30min',
  CASE 
    WHEN NOW() + INTERVAL '30 minutes' <= (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '✅ Prazo Normal'
    WHEN NOW() + INTERVAL '30 minutes' > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) 
         AND NOW() + INTERVAL '30 minutes' <= (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) THEN '⚠️ Janela Atraso'
    ELSE '🚫 Expirado'
  END
FROM quest_1_2 q
UNION ALL
SELECT '3. SIMULAÇÃO: Possibilidade de Submissão', 'T+60min',
  CASE 
    WHEN NOW() + INTERVAL '60 minutes' <= (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '✅ Prazo Normal'
    WHEN NOW() + INTERVAL '60 minutes' > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) 
         AND NOW() + INTERVAL '60 minutes' <= (q.started_at + ((q.planned_deadline_minutes + q.late_submission_window_minutes) * INTERVAL '1 minute')) THEN '⚠️ Janela Atraso'
    ELSE '🚫 Expirado'
  END
FROM quest_1_2 q;

-- PASSO 4: SUBMISSÕES RECENTES (últimas 30 min)
-- ================================================================
WITH quest_1_2 AS (
  SELECT id FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1
)
SELECT 
  '4. SUBMISSÕES RECENTES (30min)' as secao,
  t.name as team_name,
  s.submitted_at,
  s.is_late,
  s.late_minutes,
  s.late_penalty_applied,
  s.status,
  EXTRACT(EPOCH FROM (s.submitted_at - NOW()))::INTEGER / 60 as minutos_atras
FROM submissions s
JOIN teams t ON s.team_id = t.id
JOIN quest_1_2 q ON s.quest_id = q.id
WHERE s.submitted_at > NOW() - INTERVAL '30 minutes'
ORDER BY s.submitted_at DESC;

-- PASSO 5: VALIDAÇÃO DE PENALIDADE - Testar com diferentes timestamps
-- ================================================================
SELECT 
  '5. TESTE PENALIDADE' as secao,
  'Se submeter agora' as cenario,
  CASE 
    WHEN NOW() <= (
      (SELECT started_at FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1) 
      + ((SELECT planned_deadline_minutes FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1) * INTERVAL '1 minute')
    ) THEN 'Penalidade: 0 (no prazo)'
    ELSE 
      CASE 
        WHEN CEIL(
          EXTRACT(EPOCH FROM (
            NOW() - (
              (SELECT started_at FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1) 
              + ((SELECT planned_deadline_minutes FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1) * INTERVAL '1 minute')
            )
          )) / 60
        )::INTEGER <= 5 THEN 'Penalidade: 5 pontos'
        WHEN CEIL(
          EXTRACT(EPOCH FROM (
            NOW() - (
              (SELECT started_at FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1) 
              + ((SELECT planned_deadline_minutes FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1) * INTERVAL '1 minute')
            )
          )) / 60
        )::INTEGER <= 10 THEN 'Penalidade: 10 pontos'
        WHEN CEIL(
          EXTRACT(EPOCH FROM (
            NOW() - (
              (SELECT started_at FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1) 
              + ((SELECT planned_deadline_minutes FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1) * INTERVAL '1 minute')
            )
          )) / 60
        )::INTEGER <= 15 THEN 'Penalidade: 15 pontos'
        ELSE 'BLOQUEADO (> 15 min de atraso)'
      END
  END as resultado;

-- PASSO 6: SUMMARY
-- ================================================================
SELECT 
  '6. RESUMO' as secao,
  'Quest 1.2 Status' as item,
  CASE 
    WHEN NOW() <= (
      (SELECT started_at FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1) 
      + ((SELECT planned_deadline_minutes FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1) * INTERVAL '1 minute')
    ) THEN '✅ Todas equipes podem submeter SEM penalidade'
    WHEN NOW() <= (
      (SELECT started_at FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1) 
      + ((SELECT planned_deadline_minutes + late_submission_window_minutes FROM quests WHERE order_index = 2 AND phase_id = (SELECT id FROM phases WHERE order_index = 1 LIMIT 1) LIMIT 1) * INTERVAL '1 minute')
    ) THEN '⚠️ Equipes podem submeter COM penalidade'
    ELSE '🚫 Quest EXPIRADA - Nenhuma submissão possível'
  END as status_geral;
