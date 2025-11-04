-- ==================================================
-- VERIFICAÇÃO RÁPIDA: BOSS QUESTS (Todas as 5 Fases)
-- ==================================================
-- Execute este script para confirmar que todas as BOSS quests
-- estão corretamente cadastradas no banco de dados
-- ==================================================

-- 1️⃣ RESUMO: Quests por Fase
-- ==================================================
SELECT 
  p.order_index as fase,
  p.name as nome_fase,
  COUNT(q.id) as total_quests,
  COUNT(CASE WHEN q.order_index = 4 THEN 1 END) as boss_quests,
  SUM(q.max_points) as pontos_totais_fase
FROM phases p
LEFT JOIN quests q ON p.id = q.phase_id
GROUP BY p.order_index, p.name
ORDER BY p.order_index;

-- ✅ Resultado esperado: 5 fases, cada uma com 4 quests (incluindo 1 BOSS)

-- 2️⃣ LISTA COMPLETA: Todas as BOSS Quests
-- ==================================================
SELECT 
  p.order_index as fase,
  q.order_index as quest_num,
  q.name as quest_nome,
  q.deliverable_type,
  q.max_points as pontos,
  q.planned_deadline_minutes as duracao_min,
  q.late_submission_window_minutes as janela_atraso,
  CASE 
    WHEN q.deliverable_type::TEXT ILIKE '%presentation%' THEN '✅ BOSS (presentation)'
    WHEN q.order_index = 4 THEN '⚠️ BOSS (order_index)'
    ELSE '❌ NÃO É BOSS'
  END as tipo_boss
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 4
ORDER BY p.order_index;

-- ✅ Resultado esperado: 5 linhas (1 BOSS por fase)
-- Fase 1: BOSS 1 - Defesa do Problema (100 pts)
-- Fase 2: BOSS 2 - Demo do Protótipo (100 pts)
-- Fase 3: BOSS 3 - Modelo de Negócio (100 pts)
-- Fase 4: BOSS 4 - Pitch Sob Pressão (100 pts)
-- Fase 5: BOSS FINAL - Pitch Oficial (200 pts)

-- 3️⃣ DETALHES: Quests por Fase (incluindo BOSS)
-- ==================================================
SELECT 
  p.order_index as fase,
  q.order_index as num,
  q.name,
  q.deliverable_type,
  q.max_points as pts,
  q.duration_minutes as duracao,
  CASE 
    WHEN q.deliverable_type::TEXT ILIKE '%presentation%' THEN '🔥'
    ELSE '📝'
  END as tipo
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- ✅ Resultado esperado: 20 quests totais
-- Fases 1-4: 3 quests normais (📝) + 1 BOSS (🔥) cada
-- Fase 5: 3 quests normais (📝) + 1 BOSS FINAL (🔥)

-- 4️⃣ VALIDAÇÃO: Verificar deliverable_type
-- ==================================================
SELECT 
  p.order_index as fase,
  q.name,
  q.deliverable_type,
  q.deliverable_type::TEXT ILIKE '%presentation%' as eh_presentation,
  q.order_index = 4 as eh_quarta_quest
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 4;

-- ✅ Resultado esperado: Todas as 5 BOSS com deliverable_type = '{presentation}'

-- 5️⃣ CHECKLIST FINAL
-- ==================================================
SELECT 
  '✅ Total de Fases' as item,
  COUNT(DISTINCT p.order_index)::TEXT as valor,
  CASE 
    WHEN COUNT(DISTINCT p.order_index) = 5 THEN '✅ CORRETO'
    ELSE '❌ ERRO: Deveria ter 5 fases'
  END as status
FROM phases p

UNION ALL

SELECT 
  '✅ Total de Quests' as item,
  COUNT(q.id)::TEXT as valor,
  CASE 
    WHEN COUNT(q.id) = 20 THEN '✅ CORRETO (4 por fase)'
    ELSE '❌ ERRO: Deveria ter 20 quests'
  END as status
FROM quests q

UNION ALL

SELECT 
  '✅ BOSS Quests (order_index=4)' as item,
  COUNT(q.id)::TEXT as valor,
  CASE 
    WHEN COUNT(q.id) = 5 THEN '✅ CORRETO (1 por fase)'
    ELSE '❌ ERRO: Deveria ter 5 BOSS'
  END as status
FROM quests q
WHERE q.order_index = 4

UNION ALL

SELECT 
  '✅ BOSS com presentation type' as item,
  COUNT(q.id)::TEXT as valor,
  CASE 
    WHEN COUNT(q.id) = 5 THEN '✅ CORRETO'
    ELSE '❌ ERRO: Todas as BOSS devem ter type=presentation'
  END as status
FROM quests q
WHERE q.deliverable_type::TEXT ILIKE '%presentation%'

UNION ALL

SELECT 
  '✅ Pontos BOSS (Fases 1-4)' as item,
  string_agg(DISTINCT q.max_points::TEXT, ', ') as valor,
  CASE 
    WHEN COUNT(CASE WHEN q.max_points = 100 THEN 1 END) = 4 THEN '✅ CORRETO (100 pts cada)'
    ELSE '⚠️ ATENÇÃO: Verificar pontos'
  END as status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 4 AND p.order_index BETWEEN 1 AND 4

UNION ALL

SELECT 
  '✅ Pontos BOSS FINAL (Fase 5)' as item,
  q.max_points::TEXT as valor,
  CASE 
    WHEN q.max_points = 200 THEN '✅ CORRETO'
    ELSE '⚠️ ATENÇÃO: Deveria ter 200 pts'
  END as status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 4 AND p.order_index = 5;

-- ==================================================
-- 6️⃣ AÇÃO: Se alguma BOSS estiver faltando
-- ==================================================
-- Se o checklist mostrar erro, execute:
-- \i CREATE_BOSS_QUESTS.sql
-- (ou copie e cole o conteúdo de CREATE_BOSS_QUESTS.sql)

-- ==================================================
-- RESULTADO ESPERADO (Checklist)
-- ==================================================
-- ✅ Total de Fases: 5 - CORRETO
-- ✅ Total de Quests: 20 - CORRETO (4 por fase)
-- ✅ BOSS Quests (order_index=4): 5 - CORRETO (1 por fase)
-- ✅ BOSS com presentation type: 5 - CORRETO
-- ✅ Pontos BOSS (Fases 1-4): 100 - CORRETO (100 pts cada)
-- ✅ Pontos BOSS FINAL (Fase 5): 200 - CORRETO
