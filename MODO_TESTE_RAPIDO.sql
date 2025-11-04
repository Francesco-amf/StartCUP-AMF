-- ==================================================
-- 🚀 MODO TESTE RÁPIDO - StartCUP AMF
-- ==================================================
-- Este script configura o evento para teste rápido
-- TODAS as quests duram apenas 1-2 minutos
-- Evento completo roda em ~20 minutos ao invés de 12 horas
-- ==================================================

-- ========================================
-- PASSO 1: ATIVAR MODO TESTE
-- ========================================
-- Reduzir TODOS os prazos para 1-2 minutos

UPDATE quests SET
  planned_deadline_minutes = CASE
    -- BOSS quests: 1 minuto (sem atraso)
    WHEN order_index = 4 THEN 1
    -- Quest 1 de cada fase: 2 minutos
    WHEN order_index = 1 THEN 2
    -- Quest 2 e 3: 1 minuto
    ELSE 1
  END,
  late_submission_window_minutes = CASE
    -- BOSS não tem janela de atraso
    WHEN order_index = 4 THEN 0
    -- Outras quests: 0 minutos (sem atraso para acelerar)
    ELSE 0
  END;

-- ========================================
-- VERIFICAR CONFIGURAÇÃO
-- ========================================
SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.planned_deadline_minutes as prazo_minutos,
  q.late_submission_window_minutes as atraso_minutos,
  (q.planned_deadline_minutes + COALESCE(q.late_submission_window_minutes, 0)) as total_minutos
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- ========================================
-- TIMELINE ESPERADA (MODO TESTE)
-- ========================================
/*
┌─────────────────────────────────────────────────────┐
│ FASE 1 (4 minutos total)                            │
├─────────────────────────────────────────────────────┤
│ T+0min:  Quest 1.1 inicia (2 min)                   │
│ T+2min:  Quest 1.2 inicia (1 min)                   │
│ T+3min:  Quest 1.3 inicia (1 min)                   │
│ T+4min:  BOSS 1 inicia (1 min)                      │
│ T+5min:  FASE 2 INICIA                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ FASE 2 (4 minutos total)                            │
├─────────────────────────────────────────────────────┤
│ T+5min:  Quest 2.1 inicia (2 min)                   │
│ T+7min:  Quest 2.2 inicia (1 min)                   │
│ T+8min:  Quest 2.3 inicia (1 min)                   │
│ T+9min:  BOSS 2 inicia (1 min)                      │
│ T+10min: FASE 3 INICIA                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ FASE 3 (4 minutos total)                            │
├─────────────────────────────────────────────────────┤
│ T+10min: Quest 3.1 inicia (2 min)                   │
│ T+12min: Quest 3.2 inicia (1 min)                   │
│ T+13min: Quest 3.3 inicia (1 min)                   │
│ T+14min: BOSS 3 inicia (1 min)                      │
│ T+15min: FASE 4 INICIA                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ FASE 4 (4 minutos total)                            │
├─────────────────────────────────────────────────────┤
│ T+15min: Quest 4.1 inicia (2 min)                   │
│ T+17min: Quest 4.2 inicia (1 min)                   │
│ T+18min: Quest 4.3 inicia (1 min)                   │
│ T+19min: BOSS 4 inicia (1 min)                      │
│ T+20min: FASE 5 INICIA                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ FASE 5 (4 minutos total)                            │
├─────────────────────────────────────────────────────┤
│ T+20min: Quest 5.1 inicia (2 min)                   │
│ T+22min: Quest 5.2 inicia (1 min)                   │
│ T+23min: Quest 5.3 inicia (1 min)                   │
│ T+24min: BOSS 5 inicia (1 min)                      │
│ T+25min: EVENTO TERMINA ✅                          │
└─────────────────────────────────────────────────────┘

TEMPO TOTAL: ~25 minutos (ao invés de 12+ horas)
*/

-- ========================================
-- PASSO 2: RESETAR EVENTO
-- ========================================
-- Limpar todas as quests e voltar para início

UPDATE quests SET started_at = NULL, status = 'scheduled';
UPDATE event_config SET current_phase = 1;

-- Iniciar apenas Quest 1.1
UPDATE quests SET started_at = NOW(), status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 1;

-- ========================================
-- VERIFICAR ESTADO INICIAL
-- ========================================
SELECT 
  'Estado do Evento' as info,
  current_phase as fase_atual,
  event_started,
  event_ended
FROM event_config;

SELECT 
  'Quests da Fase 1' as info,
  q.order_index as quest,
  q.name,
  q.started_at,
  q.planned_deadline_minutes as prazo_min,
  CASE 
    WHEN q.started_at IS NULL THEN '❌ NÃO INICIADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '🔴 EXPIRADA'
    ELSE '🟢 ATIVA'
  END as status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;

-- ========================================
-- ✅ PRONTO PARA TESTAR!
-- ========================================
-- Aguarde 2 minutos e execute a verificação abaixo
-- para confirmar que Quest 1.2 iniciou automaticamente

/*
-- QUERY DE MONITORAMENTO (executar a cada minuto):
SELECT 
  (SELECT current_phase FROM event_config) as fase_atual,
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.started_at,
  CASE 
    WHEN q.started_at IS NULL THEN '❌ NÃO INICIADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute')) THEN '🔴 EXPIRADA'
    ELSE '🟢 ATIVA (' || EXTRACT(EPOCH FROM (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') - NOW()))::INT || 's restantes)'
  END as status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index <= (SELECT current_phase FROM event_config LIMIT 1) + 1
ORDER BY p.order_index, q.order_index;
*/
