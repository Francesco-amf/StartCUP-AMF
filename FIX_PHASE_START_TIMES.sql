-- ==================================================
-- 🔧 CORRIGIR TIMESTAMPS DE INÍCIO DAS FASES
-- ==================================================
-- Problema: Live Dashboard não mostra timer nas fases 2+
-- Causa: phase_X_start_time está NULL porque auto-advance
--        não estava setando esses valores
-- 
-- Solução: Setar phase_X_start_time retroativamente
--          baseado em when a fase mudou
-- ==================================================

-- ========================================
-- OPÇÃO 1: Setar timestamps manualmente
-- ========================================
-- Use esta opção se souber aproximadamente quando cada fase começou

-- Exemplo: Se a Fase 2 começou agora há 10 minutos:
-- UPDATE event_config 
-- SET phase_2_start_time = NOW() - INTERVAL '10 minutes';

-- Exemplo: Se a Fase 3 começou agora há 5 minutos:
-- UPDATE event_config 
-- SET phase_3_start_time = NOW() - INTERVAL '5 minutes';

-- ========================================
-- OPÇÃO 2: Setar para NOW() (fases em andamento)
-- ========================================
-- Use esta opção se a fase ACABOU DE MUDAR
-- e você quer resetar o timer para começar do zero

-- Para Fase 2 (se é a fase atual):
UPDATE event_config 
SET phase_2_start_time = NOW()
WHERE current_phase = 2 AND phase_2_start_time IS NULL;

-- Para Fase 3 (se é a fase atual):
UPDATE event_config 
SET phase_3_start_time = NOW()
WHERE current_phase = 3 AND phase_3_start_time IS NULL;

-- Para Fase 4 (se é a fase atual):
UPDATE event_config 
SET phase_4_start_time = NOW()
WHERE current_phase = 4 AND phase_4_start_time IS NULL;

-- Para Fase 5 (se é a fase atual):
UPDATE event_config 
SET phase_5_start_time = NOW()
WHERE current_phase = 5 AND phase_5_start_time IS NULL;

-- ========================================
-- OPÇÃO 3: Inferir baseado na primeira quest
-- ========================================
-- Use esta opção para tentar inferir quando a fase começou
-- baseado no started_at da primeira quest

-- Fase 2:
UPDATE event_config ec
SET phase_2_start_time = (
  SELECT q.started_at
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 2
    AND q.order_index = 1
    AND q.started_at IS NOT NULL
  LIMIT 1
)
WHERE ec.current_phase >= 2 
  AND ec.phase_2_start_time IS NULL
  AND EXISTS (
    SELECT 1 FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = 2 AND q.order_index = 1 AND q.started_at IS NOT NULL
  );

-- Fase 3:
UPDATE event_config ec
SET phase_3_start_time = (
  SELECT q.started_at
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 3
    AND q.order_index = 1
    AND q.started_at IS NOT NULL
  LIMIT 1
)
WHERE ec.current_phase >= 3 
  AND ec.phase_3_start_time IS NULL
  AND EXISTS (
    SELECT 1 FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = 3 AND q.order_index = 1 AND q.started_at IS NOT NULL
  );

-- Fase 4:
UPDATE event_config ec
SET phase_4_start_time = (
  SELECT q.started_at
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 4
    AND q.order_index = 1
    AND q.started_at IS NOT NULL
  LIMIT 1
)
WHERE ec.current_phase >= 4 
  AND ec.phase_4_start_time IS NULL
  AND EXISTS (
    SELECT 1 FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = 4 AND q.order_index = 1 AND q.started_at IS NOT NULL
  );

-- Fase 5:
UPDATE event_config ec
SET phase_5_start_time = (
  SELECT q.started_at
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 5
    AND q.order_index = 1
    AND q.started_at IS NOT NULL
  LIMIT 1
)
WHERE ec.current_phase >= 5 
  AND ec.phase_5_start_time IS NULL
  AND EXISTS (
    SELECT 1 FROM quests q
    JOIN phases p ON q.phase_id = p.id
    WHERE p.order_index = 5 AND q.order_index = 1 AND q.started_at IS NOT NULL
  );

-- ========================================
-- VERIFICAR RESULTADO
-- ========================================
SELECT 
  current_phase,
  phase_1_start_time,
  phase_2_start_time,
  phase_3_start_time,
  phase_4_start_time,
  phase_5_start_time,
  CASE 
    WHEN current_phase = 1 AND phase_1_start_time IS NOT NULL THEN '✅ OK'
    WHEN current_phase = 2 AND phase_2_start_time IS NOT NULL THEN '✅ OK'
    WHEN current_phase = 3 AND phase_3_start_time IS NOT NULL THEN '✅ OK'
    WHEN current_phase = 4 AND phase_4_start_time IS NOT NULL THEN '✅ OK'
    WHEN current_phase = 5 AND phase_5_start_time IS NOT NULL THEN '✅ OK'
    ELSE '❌ FALTA SETAR phase_' || current_phase || '_start_time'
  END as status
FROM event_config;

-- ========================================
-- 📝 INSTRUÇÕES
-- ========================================
-- 1. Execute a OPÇÃO 3 primeiro (inferir da primeira quest)
-- 2. Se ainda estiver NULL, execute OPÇÃO 2 (setar NOW())
-- 3. Verifique com a query de verificação acima
-- 4. Recarregue a Live Dashboard - timer deve aparecer!
--
-- 🔧 PRÓXIMOS PASSOS:
-- - Execute auto-advance-phase-FIXED.sql no Supabase
--   para que futuras mudanças de fase já setem o timestamp
-- ========================================
