-- 🔍 DIAGNÓSTICO: TEMPO RESIDUAL E DURAÇÃO DAS QUESTS

-- 1️⃣ Ver durações planejadas de todas quests da Fase 2
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.duration_minutes as "Duração (min)",
  q.late_submission_window_minutes as "Janela Atraso (min)",
  (q.duration_minutes + COALESCE(q.late_submission_window_minutes, 0)) as "Total com Atraso (min)"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- 2️⃣ Ver quando cada quest foi realmente ativada
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.started_at as "Iniciou",
  q.duration_minutes as "Duração (min)",
  q.started_at + (q.duration_minutes * INTERVAL '1 minute') as "Deveria Expirar",
  q.status as "Status",
  CASE 
    WHEN q.started_at IS NOT NULL THEN
      ROUND(EXTRACT(EPOCH FROM (NOW() - q.started_at)) / 60)
    ELSE NULL
  END as "Tempo Desde Início (min)"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- 3️⃣ Calcular TEMPO TOTAL RESTANTE na Fase 2
WITH quest_times AS (
  SELECT 
    SUM(q.duration_minutes) as total_planejado,
    SUM(CASE 
      WHEN q.started_at IS NOT NULL THEN
        GREATEST(0, ROUND(EXTRACT(EPOCH FROM (
          q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW()
        )) / 60))
      ELSE q.duration_minutes
    END) as total_restante
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = 2
)
SELECT 
  total_planejado as "Total Planejado (min)",
  total_restante as "Total Restante (min)",
  ROUND((total_planejado - total_restante)::numeric, 2) as "Tempo Já Consumido (min)"
FROM quest_times;

-- ============================================================================
-- ANÁLISE DO PROBLEMA:
-- ============================================================================
-- CENÁRIO ESPERADO (Fase 2):
-- - Quest 2.1: 50 min
-- - Quest 2.2: 30 min  
-- - Quest 2.3: 120 min (2h)
-- - BOSS 2.4: 25 min
-- - TOTAL: 225 min (3h45min)
--
-- CENÁRIO REAL:
-- - Quest 2.1: Foi ativada manualmente, pode ter rodado MAIS ou MENOS que 50min
-- - Quest 2.2: Está com 22min restantes (deveria ter 30min total)
-- - Quest 2.3: Vai rodar 2h
-- - BOSS 2.4: Vai rodar 10min (você disse, mas planejado é 25min)
--
-- TEMPO SOBRANDO: 2h13min
--
-- POSSÍVEIS CAUSAS:
-- 1. Quest 2.1 rodou MENOS que os 50min planejados
-- 2. Quest 2.2 foi ativada COM ATRASO (started_at ajustado errado)
-- 3. BOSS 2.4 tem duração DIFERENTE do planejado no banco
-- 4. Você quer encurtar o tempo total da fase
-- ============================================================================
