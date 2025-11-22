-- 🎯 SOLUÇÃO: AJUSTAR TEMPOS PARA BATER COM TEMPO DISPONÍVEL DA FASE

-- SITUAÇÃO ATUAL (segundo diagnóstico):
-- - Já consumido: 59 min
-- - Quest 2.2 restante: 22 min
-- - Quest 2.3: 120 min
-- - BOSS 2.4: 25 min (planejado no banco)
-- - TOTAL RESTANTE: 167 min (2h47min)

-- VOCÊ DISSE: "tempo de sobra da fase é 2h13min"
-- Isso significa que a FASE TODA deveria durar: 59min (já usado) + 2h13min = 3h12min = 192 min

-- AJUSTE NECESSÁRIO:
-- Tempo disponível: 192 - 59 (já usado) - 22 (Quest 2.2) = 111 min para Quest 2.3 + BOSS 2.4

-- OPÇÃO 1: Quest 2.3 = 101 min, BOSS = 10 min
UPDATE quests 
SET duration_minutes = 101
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 3;

UPDATE quests 
SET duration_minutes = 10
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 4;

-- OPÇÃO 2: Quest 2.3 = 86 min, BOSS = 25 min (mantém BOSS original)
-- UPDATE quests SET duration_minutes = 86
-- WHERE phase_id = (SELECT id FROM phases WHERE order_index = 2) AND order_index = 3;

-- CONFIRMAR:
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.duration_minutes as "Duração (min)",
  CASE 
    WHEN q.status = 'active' THEN 
      CONCAT(ROUND(EXTRACT(EPOCH FROM (q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW())) / 60), ' min restantes')
    ELSE '-'
  END as "Tempo Restante"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- ============================================================================
-- EXPLICAÇÃO:
-- ============================================================================
-- Você tem 2h13min (133min) de tempo TOTAL restante na fase
-- Menos 22min da Quest 2.2 atual = 111min para dividir
--
-- OPÇÃO 1 (recomendada): 
-- - Quest 2.3: 101 min (1h41min) - Prova de Conceito
-- - BOSS 2.4: 10 min - Apresentação rápida
--
-- OPÇÃO 2 (BOSS normal):
-- - Quest 2.3: 86 min (1h26min)
-- - BOSS 2.4: 25 min - Apresentação normal
-- ============================================================================
