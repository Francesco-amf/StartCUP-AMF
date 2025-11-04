-- ==================================================
-- 🔄 RESTAURAR PRAZOS NORMAIS - StartCUP AMF
-- ==================================================
-- Execute este script APÓS testar em modo rápido
-- para voltar aos prazos reais do evento
-- ==================================================

-- Restaurar prazos normais de todas as quests
UPDATE quests SET
  planned_deadline_minutes = CASE
    -- Fase 1
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 1) AND order_index = 1 THEN 60
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 1) AND order_index = 2 THEN 50
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 1) AND order_index = 3 THEN 30
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 1) AND order_index = 4 THEN 10
    
    -- Fase 2
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 1 THEN 50
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 2 THEN 30
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 3 THEN 120
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 4 THEN 10
    
    -- Fase 3
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 3) AND order_index = 1 THEN 40
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 3) AND order_index = 2 THEN 30
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 3) AND order_index = 3 THEN 70
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 3) AND order_index = 4 THEN 10
    
    -- Fase 4
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 4) AND order_index = 1 THEN 40
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 4) AND order_index = 2 THEN 40
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 4) AND order_index = 3 THEN 30
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 4) AND order_index = 4 THEN 10
    
    -- Fase 5
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 5) AND order_index = 1 THEN 20
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 5) AND order_index = 2 THEN 40
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 5) AND order_index = 3 THEN 30
    WHEN phase_id = (SELECT id FROM phases WHERE order_index = 5) AND order_index = 4 THEN 10
    
    ELSE 60 -- fallback
  END,
  late_submission_window_minutes = CASE
    -- BOSS quests (order_index = 4) não têm janela de atraso
    WHEN order_index = 4 THEN 0
    ELSE 15
  END;

-- Verificar se restaurou corretamente
SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- ✅ Prazos normais restaurados!
-- Agora você pode iniciar o evento real com os tempos corretos
