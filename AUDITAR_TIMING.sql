-- =====================================================
-- VERIFICAR INTEGRIDADE DO TIMING DAS FASES/QUESTS
-- =====================================================
-- Verifica se as mudanças afetaram o cronograma

-- 1️⃣ STATUS ATUAL DO EVENTO
SELECT '🎬 STATUS DO EVENTO' as "Status";

SELECT 
  current_phase as "Fase Atual",
  event_started as "Evento Iniciado?",
  event_end_time as "Event End Time",
  TO_CHAR(event_end_time, 'HH24:MI:SS DD/MM/YYYY') as "Formato legível",
  (event_end_time - NOW()) as "Tempo até fim",
  event_ended as "Evento Terminado?"
FROM event_config;

-- 2️⃣ VERIFICAR TIMESTAMPS DAS QUESTS
SELECT '─────────────────────────────────────' as "separator";
SELECT '⏱️ TIMESTAMPS DAS QUESTS' as "Status";

SELECT 
  p.order_index as "F",
  q.order_index as "Q",
  q.name,
  q.duration_minutes as "Duração configurada"
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- 3️⃣ VERIFICAR SE QUESTS ESTÃO CONFIGURADAS CORRETAMENTE
SELECT '─────────────────────────────────────' as "separator";
SELECT '🔍 VERIFICAÇÃO DE QUESTS' as "Status";

SELECT 
  p.order_index as "Fase",
  COUNT(*) as "Total Quests",
  SUM(q.duration_minutes) as "Duração Total",
  STRING_AGG(CONCAT('Q', q.order_index, '(', q.duration_minutes, 'min)'), ' + ') as "Detalhes"
FROM quests q
JOIN phases p ON q.phase_id = p.id
GROUP BY p.order_index
ORDER BY p.order_index;

-- 4️⃣ VERIFICAR BOSS PROTECTION
SELECT '─────────────────────────────────────' as "separator";
SELECT '🎯 BOSS QUESTS' as "Status";

SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name,
  q.deliverable_type,
  q.duration_minutes,
  CASE 
    WHEN q.deliverable_type ILIKE '%presentation%' THEN '✅ BOSS Detectado'
    ELSE '⚪ Normal'
  END as "Tipo"
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 4
ORDER BY p.order_index;

-- 5️⃣ RESUMO DE CONFIGURAÇÃO
SELECT '═════════════════════════════════════' as "separator";
SELECT '⚠️ RESUMO DE CONFIGURAÇÃO' as "Status";

SELECT 
  (SELECT COUNT(*) FROM quests) as "Total Quests",
  (SELECT COUNT(*) FROM phases) as "Total Fases",
  (SELECT SUM(duration_minutes) FROM quests) as "Duração Total (min)",
  (SELECT COUNT(*) FROM quests WHERE deliverable_type ILIKE '%presentation%') as "Boss Quests",
  (SELECT COUNT(*) FROM quests WHERE late_submission_window_minutes > 0) as "Quests com Late Window"
  
UNION ALL

SELECT 
  (SELECT COUNT(DISTINCT phase_id) FROM quests) as "Fases com quests",
  NULL,
  NULL,
  NULL,
  NULL;
