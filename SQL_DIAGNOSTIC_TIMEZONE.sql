-- ========================================================================================================
-- SQL DIAGNOSTIC: TIMEZONE ISSUE DEBUGGING
-- ========================================================================================================
-- Execute essas queries UM A UM no Supabase SQL Editor para diagnosticar o problema de deadline
-- Copie cada uma, execute, e observe o resultado
-- ========================================================================================================

-- ========================================================================================================
-- QUERY 1: Ver horário do servidor
-- ========================================================================================================
-- O que procurar: Deve mostrar o horário UTC atual
-- Se mostrar algo estranho, há um problema na configuração

SELECT
  NOW() as horario_agora,
  CURRENT_TIMESTAMP as timestamp_atual,
  TIMEZONE(CURRENT_TIMESTAMP) as timezone_configuracao,
  EXTRACT(HOUR FROM NOW()) as hora_utc;

-- Resultado esperado: NOW deve ser UTC (hora atual em UTC)
-- Se for muito diferente do seu relógio local, verifique a zona horária



-- ========================================================================================================
-- QUERY 2: Ver dados EXATOS da quest ativa
-- ========================================================================================================
-- O que procurar: Os valores de started_at e planned_deadline_minutes
-- Isto vai nos dizer se os dados estão corretos no banco

SELECT
  id,
  name,
  status,
  started_at,
  planned_deadline_minutes,
  late_submission_window_minutes,
  ORDER BY created_at DESC
  LIMIT 1;

-- Resultado esperado:
-- - started_at: Um timestamp recente (últimos minutos)
-- - planned_deadline_minutes: Deve ser ~30 (ou seu valor configurado)



-- ========================================================================================================
-- QUERY 3: IMPORTANTE! - Calcular minutos restantes NO BANCO
-- ========================================================================================================
-- O que procurar: Se isso retorna ~173 ou ~30
-- Isto nos dirá se o problema é no BANCO ou no FRONTEND

SELECT
  id,
  name,
  started_at,
  planned_deadline_minutes,
  NOW() as banco_now,
  (started_at + (planned_deadline_minutes || ' minutes')::interval) as deadline_calculado,
  EXTRACT(EPOCH FROM (
    (started_at + (planned_deadline_minutes || ' minutes')::interval) - NOW()
  )) / 60 as minutos_restantes_no_banco
FROM quests
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 1;

-- ⚠️ INTERPRETAÇÃO CRÍTICA:
-- Se "minutos_restantes_no_banco" for ~30: Problema está no FRONTEND (Opção 3)
-- Se "minutos_restantes_no_banco" for ~173: Problema está no BANCO (Opção 2)
-- Se for ~170-180: Timezone de 3 horas de diferença (confirmado!)



-- ========================================================================================================
-- QUERY 4: Ver se há diferença de timezone entre hora local e UTC
-- ========================================================================================================
-- O que procurar: Se os horários são iguais ou diferentes

SELECT
  started_at AT TIME ZONE 'UTC' as hora_utc,
  started_at AT TIME ZONE 'America/Sao_Paulo' as hora_sao_paulo,
  NOW() AT TIME ZONE 'UTC' as agora_utc,
  NOW() AT TIME ZONE 'America/Sao_Paulo' as agora_sao_paulo
FROM quests
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 1;

-- Resultado esperado:
-- - hora_utc e agora_utc: Devem estar em UTC
-- - hora_sao_paulo e agora_sao_paulo: Devem estar em GMT-3
-- - Diferença entre UTC e São Paulo: Deve ser 3 horas



-- ========================================================================================================
-- QUERY 5: Comparação lado-a-lado para debugging
-- ========================================================================================================
-- O que procurar: Uma visão completa de todos os valores

SELECT
  id,
  name,
  planned_deadline_minutes,
  -- Hora armazenada
  started_at,
  -- Interpretação como UTC
  started_at::timestamp as interpretado_utc,
  -- Deadline calculado
  (started_at::timestamp + (planned_deadline_minutes || ' minutes')::interval) as deadline_utc,
  -- Agora no banco
  NOW() as agora_banco,
  -- Diferença em minutos
  EXTRACT(EPOCH FROM (
    (started_at::timestamp + (planned_deadline_minutes || ' minutes')::interval) - NOW()
  )) / 60 as minutos_restantes,
  -- Informação de debug
  CASE
    WHEN EXTRACT(EPOCH FROM (
      (started_at::timestamp + (planned_deadline_minutes || ' minutes')::interval) - NOW()
    )) / 60 > 150 THEN '❌ MUITO TEMPO (problema de timezone?)'
    WHEN EXTRACT(EPOCH FROM (
      (started_at::timestamp + (planned_deadline_minutes || ' minutes')::interval) - NOW()
    )) / 60 > 20 THEN '✅ Tempo correto'
    WHEN EXTRACT(EPOCH FROM (
      (started_at::timestamp + (planned_deadline_minutes || ' minutes')::interval) - NOW()
    )) / 60 > 0 THEN '⚠️ Pouco tempo'
    ELSE '🚫 Deadline passou'
  END as status_diagnostico
FROM quests
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 2;

-- Isto vai mostrar claramente se há problema e quanto é



-- ========================================================================================================
-- QUERY 6: COMPARAÇÃO COM TEMPO ESPERADO
-- ========================================================================================================
-- O que procurar: Ver se o tempo está ~3 horas deslocado

WITH quest_data AS (
  SELECT
    id,
    name,
    started_at,
    planned_deadline_minutes,
    NOW() as agora
  FROM quests
  WHERE status = 'active'
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT
  name,
  started_at,
  planned_deadline_minutes,
  agora,
  -- Minutos restantes CORRETO
  EXTRACT(EPOCH FROM (
    (started_at + (planned_deadline_minutes || ' minutes')::interval) - agora
  )) / 60 as minutos_restantes_banco,
  -- Comparação: quantos minutos de diferença
  CASE
    WHEN EXTRACT(EPOCH FROM (
      (started_at + (planned_deadline_minutes || ' minutes')::interval) - agora
    )) / 60 - planned_deadline_minutes > 120 THEN
      'Diferença: ~' || CAST(
        EXTRACT(EPOCH FROM (
          (started_at + (planned_deadline_minutes || ' minutes')::interval) - agora
        )) / 60 - planned_deadline_minutes
        AS INTEGER
      ) || ' minutos (3+ horas, TIMEZONE!)'
    WHEN EXTRACT(EPOCH FROM (
      (started_at + (planned_deadline_minutes || ' minutes')::interval) - agora
    )) / 60 - planned_deadline_minutes < -10 THEN
      'Diferença: Negativa (deadline passou)'
    ELSE
      'Diferença: Dentro do normal'
  END as diagnostico
FROM quest_data;

-- ========================================================================================================
-- RESUMO: Como Interpretar Os Resultados
-- ========================================================================================================
--
-- Query 1 (NOW()): Mostra se o servidor está em UTC. Deve mostrar horário UTC.
-- Query 2 (Dados): Mostra os valores brutos no banco.
-- Query 3 (CRÍTICA): Mostra os minutos restantes NO BANCO
--   → Se ~30 minutos: Banco está correto, problema é no frontend
--   → Se ~173 minutos: Banco tem problema, precisa corrigir na ativação
-- Query 4: Mostra se há diferença entre UTC e São Paulo (~3 horas)
-- Query 5: Visão completa de todos os valores com diagnóstico automático
-- Query 6: Comparação entre tempo esperado vs tempo calculado
--
-- ========================================================================================================
-- AÇÃO RECOMENDADA
-- ========================================================================================================
--
-- 1. Execute Query 3
-- 2. Se o resultado for ~173 (não ~30), execute Query 5
-- 3. Query 5 vai dizer exatamente qual é o problema
-- 4. Compartilhe o resultado comigo para eu aplicar a solução correta
--
-- ========================================================================================================
