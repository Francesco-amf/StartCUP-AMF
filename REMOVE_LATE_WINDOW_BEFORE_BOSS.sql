-- ==========================================
-- REMOVER JANELA DE ATRASO DAS QUESTS ANTES DO BOSS
-- ==========================================
-- PROBLEMA: Quest X.3 tem 15 min de janela de atraso
--           Boss X.4 dura apenas 10 minutos
--           Se equipe atrasar X.3, perde o Boss!
-- SOLUÇÃO: Remover late_submission_window_minutes das quests 1.3, 2.3, 3.3, 4.3
--          Manter janela de atraso em todas as outras quests (inclusive 5.3)
-- ==========================================

-- Verificar estado ANTES
SELECT 
  'ANTES DA ALTERAÇÃO' as momento,
  q.name,
  q.order_index,
  q.late_submission_window_minutes,
  p.order_index as phase_number
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 3
ORDER BY p.order_index;

-- APLICAR MUDANÇA: Zerar janela de atraso nas quests 1.3, 2.3, 3.3, 4.3
UPDATE quests
SET late_submission_window_minutes = 0
WHERE order_index = 3  -- Terceira quest de cada fase
  AND phase_id IN (
    SELECT id FROM phases WHERE order_index IN (1, 2, 3, 4)
  );

-- Verificar estado DEPOIS
SELECT 
  'DEPOIS DA ALTERAÇÃO' as momento,
  q.name,
  q.order_index,
  q.late_submission_window_minutes,
  p.order_index as phase_number
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 3
ORDER BY p.order_index;

-- Verificar TODAS as quests e suas janelas de atraso
SELECT 
  'RESUMO GERAL' as tipo,
  p.order_index as fase,
  q.order_index as quest_numero,
  q.name,
  q.late_submission_window_minutes as janela_atraso_min
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;
