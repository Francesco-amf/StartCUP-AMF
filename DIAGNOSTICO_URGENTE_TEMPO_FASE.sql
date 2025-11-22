-- 🚨 DIAGNÓSTICO URGENTE: TEMPO DA FASE vs TEMPO DAS QUESTS

-- Situação AGORA:
-- - Quest 2.2: 6 min restantes
-- - Quest 2.3: 120 min
-- - BOSS 2.4: 10 min
-- - TOTAL necessário: 136 min (2h16min)
-- - Timer da fase: 1h56min (116 min)
-- 
-- PROBLEMA: Faltam 20 minutos! (136 - 116 = 20 min)

-- 1️⃣ Ver tempo exato restante agora
SELECT 
  q.order_index as "Quest",
  q.name as "Nome",
  q.status as "Status",
  q.duration_minutes as "Duração Total",
  CASE 
    WHEN q.status = 'active' AND q.started_at IS NOT NULL THEN
      GREATEST(0, ROUND(EXTRACT(EPOCH FROM (
        q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW()
      )) / 60))
    WHEN q.status = 'scheduled' THEN q.duration_minutes
    ELSE 0
  END as "Tempo Restante (min)"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2
ORDER BY q.order_index;

-- 2️⃣ Calcular SOMA total necessária
SELECT 
  SUM(CASE 
    WHEN q.status = 'active' AND q.started_at IS NOT NULL THEN
      GREATEST(0, ROUND(EXTRACT(EPOCH FROM (
        q.started_at + (q.duration_minutes * INTERVAL '1 minute') - NOW()
      )) / 60))
    WHEN q.status = 'scheduled' THEN q.duration_minutes
    ELSE 0
  END) as "Total Minutos Necessários"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 2;

-- ============================================================================
-- SOLUÇÕES POSSÍVEIS:
-- ============================================================================
-- 
-- OPÇÃO A: Reduzir Quest 2.3 de 120min para 100min
--   - Quest 2.2: 6 min
--   - Quest 2.3: 100 min
--   - BOSS 2.4: 10 min
--   - TOTAL: 116 min (1h56min) ✅ ENCAIXA PERFEITAMENTE
--
-- OPÇÃO B: Reduzir BOSS 2.4 de 10min para 0min (pular?)
--   - Não recomendado
--
-- OPÇÃO C: Ajustar started_at da Quest 2.2 para dar mais tempo
--   - Adicionar 20 minutos ao started_at (empurrar para trás)
--   - Quest 2.2 ficaria com 26 minutos restantes
--   - TOTAL: 26 + 120 + 10 = 156 min (2h36min)
--   - Mas o timer da fase ainda mostraria 1h56min
--
-- RECOMENDAÇÃO: OPÇÃO A - Reduzir Quest 2.3 para 100 minutos
-- ============================================================================
