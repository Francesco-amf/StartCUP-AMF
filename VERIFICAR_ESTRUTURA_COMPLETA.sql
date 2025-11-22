-- =====================================================
-- VERIFICAR ESTRUTURA COMPLETA DO SISTEMA
-- =====================================================
-- Requisitos:
-- Fases 1-4: 3 quests normais + 1 boss (10 min)
--   - Q1, Q2, Q3 (SEM late window)
--   - Boss (10 min, duração fixa)
-- Fase 5: 3 quests (todas COM late window)
--   + 20 min avaliação ao final
-- =====================================================

-- 1. VERIFICAR ESTRUTURA POR FASE
SELECT 
  '📊 ESTRUTURA GERAL' as "Status";

SELECT 
  p.order_index as "Fase",
  p.name as "Nome",
  COUNT(q.id) as "Total Quests",
  STRING_AGG(
    q.order_index || ':' || q.name || 
    ' (' || q.duration_minutes || 'min' ||
    CASE WHEN q.late_submission_window_minutes > 0 
      THEN '+' || q.late_submission_window_minutes || 'min late' 
      ELSE '' 
    END ||
    CASE WHEN q.deliverable_type ILIKE '%presentation%' THEN ' [BOSS]' ELSE '' END ||
    ')', 
    ' | '
  ) as "Quests Detalhado"
FROM phases p
LEFT JOIN quests q ON q.phase_id = p.id
GROUP BY p.order_index, p.name
ORDER BY p.order_index;

-- 2. VERIFICAR DETALHES DE CADA QUEST
SELECT '─────────────────────────────────────' as "separator";
SELECT 
  '📋 DETALHES DE CADA QUEST' as "Status";

SELECT 
  p.order_index as "Fase",
  q.order_index as "Quest",
  q.name,
  q.duration_minutes as "Duração",
  COALESCE(q.late_submission_window_minutes, 0) as "Late Window",
  CASE 
    WHEN q.deliverable_type ILIKE '%presentation%' THEN '✅ BOSS'
    ELSE '⚪ Normal'
  END as "Tipo",
  CASE 
    WHEN p.order_index <= 4 AND q.order_index = 4 THEN '🎯 Esperado: 10 min'
    WHEN p.order_index <= 4 AND q.order_index < 4 THEN '🎯 Esperado: SEM late'
    WHEN p.order_index = 5 THEN '🎯 Esperado: COM late'
    ELSE 'N/A'
  END as "Requisito",
  CASE
    WHEN p.order_index <= 4 AND q.order_index = 4 AND q.duration_minutes = 10 THEN '✅ OK'
    WHEN p.order_index <= 4 AND q.order_index < 4 AND q.late_submission_window_minutes = 0 THEN '✅ OK'
    WHEN p.order_index = 5 AND q.late_submission_window_minutes > 0 THEN '✅ OK'
    ELSE '❌ ERRO'
  END as "Status"
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- 3. RESUMO DE VALIDAÇÃO
SELECT '─────────────────────────────────────' as "separator";
SELECT 
  '✅ VALIDAÇÃO DE REQUISITOS' as "Status";

WITH validation AS (
  SELECT 
    CASE 
      WHEN 
        (SELECT COUNT(*) FROM phases p 
         WHERE p.order_index <= 4) = 4
        AND
        (SELECT COUNT(*) FROM quests q 
         JOIN phases p ON q.phase_id = p.id
         WHERE p.order_index <= 4) = 16  -- 4 fases x 4 quests
      THEN '✅ FASES 1-4: 4 fases com 4 quests cada'
      ELSE '❌ FASES 1-4: Estrutura incorreta'
    END as "req_1",
    
    CASE 
      WHEN 
        (SELECT COUNT(*) FROM quests q 
         JOIN phases p ON q.phase_id = p.id
         WHERE p.order_index <= 4 AND q.order_index IN (1,2,3)) = 12
        AND
        (SELECT COUNT(*) FROM quests q 
         JOIN phases p ON q.phase_id = p.id
         WHERE p.order_index <= 4 AND q.order_index IN (1,2,3) 
         AND q.late_submission_window_minutes = 0) = 12
      THEN '✅ Q1-Q3 (Fases 1-4): SEM late window'
      ELSE '❌ Q1-Q3 (Fases 1-4): Têm late window'
    END as "req_2",
    
    CASE 
      WHEN 
        (SELECT COUNT(*) FROM quests q 
         JOIN phases p ON q.phase_id = p.id
         WHERE p.order_index <= 4 AND q.order_index = 4
         AND q.deliverable_type ILIKE '%presentation%') = 4
      THEN '✅ Boss (Fases 1-4): Tipo apresentação'
      ELSE '❌ Boss: Tipo incorreto'
    END as "req_3",
    
    CASE 
      WHEN 
        (SELECT COUNT(*) FROM quests q 
         JOIN phases p ON q.phase_id = p.id
         WHERE p.order_index <= 4 AND q.order_index = 4
         AND q.duration_minutes = 10) = 4
      THEN '✅ Boss (Fases 1-4): Duração 10 min'
      ELSE '❌ Boss: Duração incorreta'
    END as "req_4",
    
    CASE 
      WHEN 
        (SELECT COUNT(*) FROM phases WHERE order_index = 5) = 1
        AND
        (SELECT COUNT(*) FROM quests q 
         JOIN phases p ON q.phase_id = p.id
         WHERE p.order_index = 5) = 3
      THEN '✅ Fase 5: 3 quests'
      ELSE '❌ Fase 5: Estrutura incorreta'
    END as "req_5",
    
    CASE 
      WHEN 
        (SELECT COUNT(*) FROM quests q 
         JOIN phases p ON q.phase_id = p.id
         WHERE p.order_index = 5 
         AND q.late_submission_window_minutes > 0) = 3
      THEN '✅ Fase 5: Todas COM late window'
      ELSE '❌ Fase 5: Faltam late windows'
    END as "req_6",
    
    CASE 
      WHEN 
        (SELECT COUNT(*) FROM phases WHERE order_index = 5) = 1
        AND
        (SELECT COUNT(*) FROM quests q 
         JOIN phases p ON q.phase_id = p.id
         WHERE p.order_index = 5
         AND q.deliverable_type ILIKE '%presentation%') = 0
      THEN '✅ Fase 5: SEM boss'
      ELSE '❌ Fase 5: Tem boss (não deveria)'
    END as "req_7"
)
SELECT 
  req_1, req_2, req_3, req_4, req_5, req_6, req_7
FROM validation;

-- 4. LÓGICA DE FUNCIONAMENTO (como deve ser)
SELECT '─────────────────────────────────────' as "separator";
SELECT 
  '🔄 COMO FUNCIONA' as "Status";

SELECT 
  '1. Sistema vai automaticamente' as "Passo",
  'Phase 1.1 → 1.2 → 1.3 → 1.4(BOSS) → Phase 2.1 → ...' as "Fluxo"

UNION ALL

SELECT 
  '2. Q1-Q3 (Fases 1-4)',
  'Sem late window, sequencial automático'

UNION ALL

SELECT 
  '3. Boss (10 min)',
  'Duração fixa 10 min, depois próxima phase'

UNION ALL

SELECT 
  '4. Fase 5 (Q1, Q2, Q3)',
  'Todas com late window'

UNION ALL

SELECT 
  '5. Late Window',
  'Vale APENAS para equipes - se atrasarem, entregam na late window'

UNION ALL

SELECT 
  '6. Próxima quest já roda',
  'Se equipe entrega atrasada, próxima quest já começou'

UNION ALL

SELECT 
  '7. Final do evento',
  'Quest 5.3 + 15 min late window + 20 min avaliação = FIM'

UNION ALL

SELECT 
  '8. Countdown geral',
  'event_end_time = NOW() + 12h 20min (quests + 20 min avaliação)';

-- 5. CALCULANDO CRONOGRAMA COMPLETO
SELECT '─────────────────────────────────────' as "separator";
SELECT 
  '⏱️ CRONOGRAMA ESPERADO' as "Status";

WITH quest_sequence AS (
  SELECT 
    p.order_index as phase_idx,
    p.name as phase_name,
    q.order_index as quest_idx,
    q.name as quest_name,
    q.duration_minutes,
    ROW_NUMBER() OVER (ORDER BY p.order_index, q.order_index) as seq,
    CASE 
      WHEN q.deliverable_type ILIKE '%presentation%' THEN 'BOSS (protegido)'
      ELSE 'Normal'
    END as tipo
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  ORDER BY p.order_index, q.order_index
)
SELECT 
  seq as "#",
  phase_idx as "F",
  quest_idx as "Q",
  quest_name as "Nome",
  duration_minutes as "Min",
  tipo as "Tipo"
FROM quest_sequence;

-- 6. TEMPO TOTAL ESPERADO
SELECT '─────────────────────────────────────' as "separator";
SELECT 
  '📐 TEMPO TOTAL' as "Status";

WITH all_times AS (
  SELECT 
    COALESCE(SUM(q.duration_minutes), 0) as total_quest_mins,
    20 as evaluation_window
  FROM quests q
)
SELECT 
  total_quest_mins as "Todas as quests (min)",
  evaluation_window as "Avaliação final (min)",
  (total_quest_mins + evaluation_window) as "TOTAL (min)",
  ((total_quest_mins + evaluation_window) / 60) || 'h ' || 
  ((total_quest_mins + evaluation_window) % 60) || 'min' as "Em horas"
FROM all_times;

-- 7. SUMÁRIO FINAL
SELECT '═════════════════════════════════════' as "separator";
SELECT 
  '🎯 SUMÁRIO FINAL' as "Status";

SELECT 
  'Fases 1-4' as "Componente",
  '3 quests normais + 1 boss' as "Estrutura",
  'Sequential automático' as "Funcionamento"

UNION ALL

SELECT 
  'Boss (10 min)',
  'Uma por fase (fases 1-4)',
  'Protegido contra auto-ativação'

UNION ALL

SELECT 
  'Fase 5',
  '3 quests (SEM boss)',
  'Todas com late window'

UNION ALL

SELECT 
  'Late Window',
  'Apenas para equipes (não afeta sistema)',
  'Se atrasam, próxima quest já rodando'

UNION ALL

SELECT 
  'Final do evento',
  'Q5.3 termina + 15 min + 20 min avaliação',
  'System countdown até event_end_time'

UNION ALL

SELECT 
  'Duração total',
  'Soma de todos os duration_minutes + 20 min',
  'Sistema corre automaticamente';
