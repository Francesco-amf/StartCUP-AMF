-- ==========================================
-- REMOVER JANELA DE ATRASO DAS QUESTS ANTES DO BOSS E DOS BOSSES
-- ==========================================
-- PROBLEMA: Quest X.3 tem 15 min de janela de atraso
--           Boss X.4 dura apenas 10 minutos
--           Se equipe atrasar X.3, perde o Boss!
--           Boss também não pode ter janela de atraso (é apresentação presencial)
-- SOLUÇÃO: Remover late_submission_window_minutes de:
--          - Quests 1.3, 2.3, 3.3, 4.3 (antes dos Bosses)
--          - Bosses 1.4, 2.4, 3.4, 4.4 (não aceitam submissão atrasada)
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

-- APLICAR MUDANÇA: Zerar janela de atraso nas quests 1.3, 2.3, 3.3, 4.3 E nos Bosses 1.4, 2.4, 3.4, 4.4
UPDATE quests
SET late_submission_window_minutes = 0
WHERE (
  -- Terceiras quests das fases 1-4 (antes dos Bosses)
  (order_index = 3 AND phase_id IN (
    SELECT id FROM phases WHERE order_index IN (1, 2, 3, 4)
  ))
  OR
  -- Bosses (quarta quest das fases 1-4)
  (order_index = 4 AND phase_id IN (
    SELECT id FROM phases WHERE order_index IN (1, 2, 3, 4)
  ))
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
