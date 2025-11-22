-- 🔧 AJUSTAR DURAÇÕES PARA FECHAR OS TEMPOS DA FASE 2

-- CENÁRIO ATUAL (segundo você):
-- - Quest 2.2: 22 min restantes (ok, deixa rodar)
-- - Quest 2.3: 2h planejadas (120 min)
-- - BOSS 2.4: 10 min (você quer 10, não 25)
-- - SOBRA: 2h13min (133 min)

-- OBJETIVO: Consumir os 2h13min sobrando distribuindo nas quests

-- OPÇÃO 1: Aumentar Quest 2.3 para consumir todo o tempo sobrando
-- Quest 2.3 = 120min + 133min = 253min (4h13min)
-- BOSS 2.4 = 10min
-- Total: 22 + 253 + 10 = 285min (4h45min)

UPDATE quests 
SET duration_minutes = 253
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) 
  AND order_index = 3;

UPDATE quests 
SET duration_minutes = 10
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) 
  AND order_index = 4;

-- OPÇÃO 2: Distribuir proporcionalmente
-- Quest 2.3 = 120 + 100 = 220min (3h40min)
-- BOSS 2.4 = 10 + 33 = 43min
-- Total: 22 + 220 + 43 = 285min (4h45min)

-- UPDATE quests SET duration_minutes = 220
-- WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 3;
-- 
-- UPDATE quests SET duration_minutes = 43
-- WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 4;

-- OPÇÃO 3: Manter tempos originais e ENCURTAR a fase
-- (Não fazer nada, fase termina mais cedo)

-- VERIFICAR:
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.duration_minutes as "Nova Duração (min)",
  ROUND(q.duration_minutes / 60.0, 2) as "Nova Duração (h)"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- ============================================================================
-- RECOMENDAÇÃO:
-- ============================================================================
-- Eu sugiro OPÇÃO 1:
-- - Quest 2.3 = 253min (4h13min) - Tempo suficiente para desenvolver protótipo
-- - BOSS 2.4 = 10min - Apresentação rápida
--
-- Isso consome TODO o tempo sobrando e mantém a fase com duração total correta
-- ============================================================================
