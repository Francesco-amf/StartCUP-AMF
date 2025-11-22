-- ========================================
-- EMERGÊNCIA: FECHAR E EXPIRAR QUEST 3.2
-- ========================================
-- Data: 2025-11-22
-- Uso: Se Quest 3.2 não expirar automaticamente após ativar próxima quest
-- Objetivo: Fechar status E ajustar started_at para forçar expiração visual

-- ========================================
-- PASSO 1: Verificar estado atual da Quest 3.2
-- ========================================
SELECT 
  '=== QUEST 3.2 - ESTADO ATUAL ===' as info,
  id,
  name,
  status,
  started_at,
  duration_minutes,
  planned_deadline_minutes,
  -- Calcular deadline
  started_at + (planned_deadline_minutes || ' minutes')::INTERVAL as deadline_calculado,
  -- Verificar se já expirou visualmente
  CASE 
    WHEN NOW() > (started_at + (planned_deadline_minutes || ' minutes')::INTERVAL + (late_submission_window_minutes || ' minutes')::INTERVAL)
    THEN '✅ EXPIRADO'
    ELSE '❌ AINDA ATIVO VISUALMENTE'
  END as status_visual
FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3)
  AND order_index = 2;

-- ========================================
-- PASSO 2: FECHAR E FORÇAR EXPIRAÇÃO DA QUEST 3.2
-- ========================================
-- EXECUTAR APENAS SE QUEST 3.2 AINDA APARECER COMO ATIVA NOS DASHBOARDS

-- ✅ CORREÇÃO COMPLETA: Ajustar started_at E planned_deadline_minutes
-- Lógica de expiração: NOW > (started_at + planned_deadline + late_window)
-- Se started_at = NOW - 100min E planned_deadline = 1min → expira com certeza

UPDATE quests
SET 
  status = 'closed',
  -- Ajustar started_at para 100 minutos no passado
  started_at = NOW() - INTERVAL '100 minutes',
  -- Ajustar planned_deadline para 1 minuto apenas
  -- Isso garante que started_at + planned_deadline < NOW
  planned_deadline_minutes = 1,
  -- Manter duration_minutes original para histórico
  duration_minutes = duration_minutes
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3)
  AND order_index = 2;

-- ========================================
-- PASSO 3: Verificar resultado
-- ========================================
SELECT 
  '=== QUEST 3.2 - APÓS CORREÇÃO ===' as info,
  id,
  name,
  status,
  started_at,
  duration_minutes,
  planned_deadline_minutes,
  started_at + (planned_deadline_minutes || ' minutes')::INTERVAL as deadline_calculado,
  -- Agora deve estar expirado
  CASE 
    WHEN NOW() > (started_at + (planned_deadline_minutes || ' minutes')::INTERVAL + (late_submission_window_minutes || ' minutes')::INTERVAL)
    THEN '✅ EXPIRADO'
    ELSE '❌ AINDA ATIVO'
  END as status_visual,
  -- Quanto tempo "no passado" está o started_at
  EXTRACT(EPOCH FROM (NOW() - started_at)) / 60 as minutos_desde_inicio
FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 3)
  AND order_index = 2;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- status: 'closed'
-- status_visual: '✅ EXPIRADO'
-- minutos_desde_inicio: ~100 minutos (ou mais)

-- ========================================
-- NOTA: Após executar, dashboards vão atualizar em até 10 segundos
-- devido ao CurrentQuestPoller (WebSocket + reload automático)
-- ========================================
