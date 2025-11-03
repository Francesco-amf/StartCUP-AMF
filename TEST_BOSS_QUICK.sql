-- ========================================
-- TESTE RÁPIDO DO SISTEMA BOSS
-- ========================================
-- Este script permite testar o BOSS sem esperar os tempos reais
-- Execute cada seção conforme necessário
-- ========================================

-- PASSO 1: Verificar se BOSS foram criados
-- ========================================
SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.deliverable_type,
  q.max_points,
  q.duration_minutes,
  q.status
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- ========================================
-- PASSO 2: FORÇAR FASE 1 A ESTAR ATIVA
-- ========================================
-- Atualiza event_config para mostrar Fase 1 como ativa
UPDATE event_config 
SET 
  current_phase_id = (SELECT id FROM phases WHERE order_index = 1),
  event_status = 'in_progress',
  event_started = true,
  started_at = NOW() - INTERVAL '1 hour';

-- Força Fase 1 a estar "in_progress"
UPDATE phases 
SET 
  status = 'in_progress',
  started_at = NOW() - INTERVAL '1 hour'
WHERE order_index = 1;

-- ========================================
-- PASSO 3: ATIVAR QUEST 1 (para começar a testar)
-- ========================================
UPDATE quests 
SET 
  status = 'active',
  started_at = NOW() - INTERVAL '5 minutes'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 1;

-- ========================================
-- PASSO 4: SIMULAR PROGRESSÃO ATÉ O BOSS
-- ========================================
-- Opção A: Marcar Quests 1, 2, 3 como completadas RAPIDAMENTE
-- (permite BOSS aparecer automaticamente pelo PhaseController)

-- Completar Quest 1
UPDATE quests 
SET 
  status = 'completed',
  started_at = NOW() - INTERVAL '65 minutes',
  completed_at = NOW() - INTERVAL '5 minutes'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 1;

-- Completar Quest 2
UPDATE quests 
SET 
  status = 'completed',
  started_at = NOW() - INTERVAL '55 minutes',
  completed_at = NOW() - INTERVAL '5 minutes'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 2;

-- Completar Quest 3
UPDATE quests 
SET 
  status = 'completed',
  started_at = NOW() - INTERVAL '35 minutes',
  completed_at = NOW() - INTERVAL '5 minutes'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 3;

-- ========================================
-- PASSO 5: ATIVAR O BOSS MANUALMENTE
-- ========================================
-- Forçar BOSS a ficar ativo (para testar a UI)
UPDATE quests 
SET 
  status = 'active',
  started_at = NOW()
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 4
  AND 'presentation' = ANY(deliverable_type);

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
-- Ver estado atual de todas as quests da Fase 1
SELECT 
  q.order_index,
  q.name,
  q.status,
  q.deliverable_type,
  CASE 
    WHEN q.started_at IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (NOW() - q.started_at))/60 
    ELSE 0 
  END as minutos_desde_inicio,
  q.duration_minutes as duracao_planejada
FROM quests q
WHERE q.phase_id = (SELECT id FROM phases WHERE order_index = 1)
ORDER BY q.order_index;

-- ========================================
-- VERIFICAR EVENT_CONFIG
-- ========================================
SELECT 
  ec.event_status,
  ec.event_started,
  p.order_index as fase_atual,
  p.name as nome_fase,
  p.status as status_fase
FROM event_config ec
LEFT JOIN phases p ON ec.current_phase_id = p.id;

-- ========================================
-- RESETAR TUDO (para recomeçar teste)
-- ========================================
/*
-- Descomente para resetar e testar novamente

-- Resetar todas as quests da Fase 1
UPDATE quests 
SET 
  status = 'scheduled',
  started_at = NULL,
  completed_at = NULL
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1);

-- Resetar Fase 1
UPDATE phases 
SET 
  status = 'scheduled',
  started_at = NULL,
  completed_at = NULL
WHERE order_index = 1;

-- Resetar event_config
UPDATE event_config 
SET 
  current_phase_id = NULL,
  event_status = 'scheduled',
  event_started = false,
  started_at = NULL;
*/

-- ========================================
-- RESUMO DO TESTE
-- ========================================
SELECT 
  '✅ Execute os passos 1-5 em sequência' as instrucao,
  '1. Verificar criação' as passo_1,
  '2. Ativar Fase 1' as passo_2,
  '3. Ativar Quest 1' as passo_3,
  '4. Completar Quests 1-3' as passo_4,
  '5. Ativar BOSS' as passo_5,
  'Abra /live-dashboard e /equipes/submissao para ver BOSS' as resultado;
