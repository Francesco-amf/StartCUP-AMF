-- =====================================================
-- VERIFICAÇÃO RÁPIDA DA ESTRUTURA (Compacta)
-- =====================================================

-- 1️⃣ VALIDAÇÃO DOS 7 REQUISITOS (PRINCIPAL)
SELECT 
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM phases WHERE order_index <= 4) = 4
      AND (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id WHERE p.order_index <= 4) = 16
    THEN '✅ Fases 1-4: 4 fases x 4 quests'
    ELSE '❌ Fases 1-4: ERRO'
  END as "Req 1",
  
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
       WHERE p.order_index <= 4 AND q.order_index IN (1,2,3) AND q.late_submission_window_minutes = 0) = 12
    THEN '✅ Q1-Q3: SEM late'
    ELSE '❌ Q1-Q3: TÊM late'
  END as "Req 2",
  
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
       WHERE p.order_index <= 4 AND q.order_index = 4 AND q.deliverable_type ILIKE '%presentation%') = 4
    THEN '✅ Boss: Tipo OK'
    ELSE '❌ Boss: Tipo ERRO'
  END as "Req 3",
  
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
       WHERE p.order_index <= 4 AND q.order_index = 4 AND q.duration_minutes = 10) = 4
    THEN '✅ Boss: 10 min'
    ELSE '❌ Boss: DURAÇÃO ERRADA'
  END as "Req 4",
  
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id WHERE p.order_index = 5) = 3
    THEN '✅ Fase 5: 3 quests'
    ELSE '❌ Fase 5: NÚMERO ERRADO'
  END as "Req 5",
  
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
       WHERE p.order_index = 5 AND q.late_submission_window_minutes > 0) = 3
    THEN '✅ F5: Todas COM late'
    ELSE '❌ F5: FALTAM late'
  END as "Req 6",
  
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM quests q JOIN phases p ON q.phase_id = p.id 
       WHERE p.order_index = 5 AND q.deliverable_type ILIKE '%presentation%') = 0
    THEN '✅ F5: SEM boss'
    ELSE '❌ F5: TEM boss'
  END as "Req 7";

-- 2️⃣ TODAS AS QUESTS COM DETALHES
SELECT 
  p.order_index as "F",
  q.order_index as "Q",
  q.name,
  q.duration_minutes as "Dur",
  COALESCE(q.late_submission_window_minutes, 0) as "Late",
  CASE WHEN q.deliverable_type ILIKE '%presentation%' THEN 'BOSS' ELSE 'Normal' END as "Tipo"
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- 3️⃣ TEMPO TOTAL
SELECT 
  SUM(q.duration_minutes) as "Quests Total (min)",
  20 as "Avaliação (min)",
  SUM(q.duration_minutes) + 20 as "TOTAL (min)",
  ROUND((SUM(q.duration_minutes) + 20) / 60.0, 2) as "Em horas"
FROM quests q;
