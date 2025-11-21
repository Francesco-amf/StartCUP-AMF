-- ============================================================================
-- TEST_BOSS_PROTECTION.sql
-- ============================================================================
-- Script de teste para verificar se proteção de boss funciona
-- Copie e execute este script no Supabase SQL Editor
-- 
-- O teste simula:
-- 1. Reset do sistema
-- 2. Inicia evento Phase 1
-- 3. Inicia Quest 1.1
-- 4. Tenta ativar próxima quest (deve bloquear)
-- 5. Expira Quest 1.1 e ativa Quest 1.2
-- 6. Simula ciclo completo até Boss
-- 7. Verifica se Boss é bloqueado automaticamente
-- ============================================================================

-- ===== PASSO 1: RESET INICIAL =====
SELECT 'PASSO 1: Resetando sistema...' as "Status";

UPDATE event_config 
SET current_phase = 0, event_started = false
WHERE id = 'event_config_singleton';

UPDATE quests 
SET started_at = NULL, ended_at = NULL, status = 'scheduled'
WHERE true;

SELECT 'PASSO 1: ✅ Completo' as "Status";

-- ===== PASSO 2: INICIAR EVENTO =====
SELECT 'PASSO 2: Iniciando evento (Phase 1)...' as "Status";

UPDATE event_config
SET current_phase = 1, event_started = true
WHERE id = 'event_config_singleton';

SELECT current_phase, event_started FROM event_config LIMIT 1;

-- ===== PASSO 3: BUSCAR QUESTS E BOSS =====
SELECT 'PASSO 3: Buscando quests de Phase 1...' as "Status";

WITH phase1 AS (
  SELECT id FROM phases WHERE order_index = 1
),
quests_phase1 AS (
  SELECT 
    q.id,
    q.order_index,
    q.deliverable_type,
    q.status,
    q.started_at
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1
  ORDER BY q.order_index
)
SELECT 
  order_index,
  CASE 
    WHEN order_index = 4 THEN '🔴 BOSS'
    ELSE 'Regular Quest'
  END as "Tipo",
  deliverable_type as "Deliverable",
  status
FROM quests_phase1;

-- ===== PASSO 4: INICIAR QUEST 1.1 =====
SELECT 'PASSO 4: Iniciando Quest 1.1...' as "Status";

UPDATE quests q
SET started_at = NOW(), status = 'active'
FROM phases p
WHERE q.phase_id = p.id 
  AND p.order_index = 1 
  AND q.order_index = 1;

SELECT 'Quest 1.1 iniciada' as "Status", NOW() as "Timestamp";

-- ===== PASSO 5: CHAMAR auto_start_next_quest (deve NÃO ativar 1.2) =====
SELECT 'PASSO 5: Chamando auto_start_next_quest com Quest 1.1 ativa...' as "Status";

SELECT auto_start_next_quest();

SELECT 'Verificando se Quest 1.2 foi ativada...' as "Status";

SELECT 
  order_index,
  status,
  started_at,
  CASE 
    WHEN started_at IS NOT NULL THEN '❌ BUG - foi ativada (não deveria)'
    ELSE '✅ Correto - não foi ativada'
  END as "Resultado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 2;

-- ===== PASSO 6: EXPIRAR QUEST 1.1 E ATIVAR 1.2 =====
SELECT 'PASSO 6: Expirando Quest 1.1 e testando auto-ativação de 1.2...' as "Status";

UPDATE quests q
SET started_at = (NOW() - INTERVAL '60 minutes')
FROM phases p
WHERE q.phase_id = p.id 
  AND p.order_index = 1 
  AND q.order_index = 1;

SELECT auto_start_next_quest();

SELECT 
  1.2 as "Quest",
  CASE 
    WHEN q.started_at IS NOT NULL THEN '✅ Auto-ativada'
    ELSE '❌ Não foi ativada'
  END as "Resultado"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 2;

-- ===== PASSO 7: CICLAR QUEST 1.2 E 1.3 =====
SELECT 'PASSO 7: Ciclando Quest 1.2 e 1.3...' as "Status";

UPDATE quests q
SET started_at = (NOW() - INTERVAL '60 minutes')
FROM phases p
WHERE q.phase_id = p.id 
  AND p.order_index = 1 
  AND q.order_index = 2;

SELECT auto_start_next_quest();

UPDATE quests q
SET started_at = (NOW() - INTERVAL '60 minutes')
FROM phases p
WHERE q.phase_id = p.id 
  AND p.order_index = 1 
  AND q.order_index = 3;

SELECT auto_start_next_quest();

SELECT 'Quests ativas:' as "Status";

SELECT 
  order_index,
  CASE WHEN order_index = 4 THEN '🔴 BOSS' ELSE 'Quest' END as "Tipo",
  started_at
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 
  AND (q.order_index = 3 OR q.order_index = 4);

-- ===== PASSO 8: TESTE CRÍTICO - BOSS DEVE SER BLOQUEADO =====
SELECT '=== PASSO 8: TESTE CRÍTICO - BOSS DEVE SER BLOQUEADO ===' as "Status";

SELECT auto_start_next_quest();

SELECT 
  4 as "Quest",
  CASE 
    WHEN q.started_at IS NOT NULL THEN '❌ BUG - BOSS foi ativada automaticamente!'
    ELSE '✅ PROTEÇÃO OK - BOSS foi bloqueada!'
  END as "RESULTADO CRÍTICO"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 4;

-- ===== PASSO 9: VERIFICAR FUNÇÃO =====
SELECT '=== INFORMAÇÕES DA FUNÇÃO ===' as "Status";

SELECT 
  prosrc as "Código da Função",
  length(prosrc) as "Tamanho (bytes)"
FROM pg_proc
WHERE proname = 'auto_start_next_quest'
LIMIT 1;

-- ===== RESUMO FINAL =====
SELECT '=== TESTE COMPLETO ===' as "Resultado Final";

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TUDO CORRETO - Sistema pronto para evento'
    ELSE '❌ PROBLEMAS ENCONTRADOS'
  END as "Status"
FROM (
  SELECT id FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 1 
    AND q.order_index = 4 
    AND q.started_at IS NOT NULL
) AS boss_ativado;
