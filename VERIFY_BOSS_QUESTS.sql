-- ========================================
-- VERIFICAR ESTRUTURA DE QUESTS E BOSS
-- ========================================
-- Execute este SQL no Supabase SQL Editor para verificar
-- se existem quests BOSS e como estão configuradas
-- ========================================

-- PASSO 1: Ver quantas quests existem por fase
-- ========================================
SELECT 
  p.order_index as fase,
  p.name as nome_fase,
  COUNT(q.id) as total_quests,
  string_agg(q.order_index::text || '. ' || q.name, ' | ' ORDER BY q.order_index) as quests
FROM phases p
LEFT JOIN quests q ON p.id = q.phase_id
GROUP BY p.order_index, p.name
ORDER BY p.order_index;

-- PASSO 2: Ver TODAS as quests detalhadamente
-- ========================================
SELECT 
  p.order_index as fase,
  q.order_index as quest_num,
  q.name as quest_nome,
  q.deliverable_type as tipo_entrega,
  q.max_points as pontos,
  q.planned_deadline_minutes as prazo_min,
  q.status,
  q.id
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;

-- PASSO 3: Procurar quests com "BOSS" ou "Boss" no nome
-- ========================================
SELECT 
  p.order_index as fase,
  q.order_index as quest_num,
  q.name as quest_nome,
  q.deliverable_type as tipo_entrega,
  q.max_points as pontos,
  q.planned_deadline_minutes as prazo_min
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.name ILIKE '%boss%' OR q.name ILIKE '%apresent%' OR q.name ILIKE '%pitch%'
ORDER BY p.order_index, q.order_index;

-- PASSO 4: Verificar se há quest com order_index = 4 em cada fase
-- ========================================
SELECT 
  p.order_index as fase,
  p.name as nome_fase,
  q.order_index as quest_num,
  q.name as quest_nome,
  q.deliverable_type as tipo_entrega,
  q.max_points as pontos
FROM phases p
LEFT JOIN quests q ON p.id = q.phase_id AND q.order_index = 4
WHERE p.order_index BETWEEN 1 AND 5
ORDER BY p.order_index;

-- PASSO 5: Verificar tabela boss_battles
-- ========================================
SELECT 
  COUNT(*) as total_boss_battles,
  COUNT(DISTINCT team_id) as equipes_com_boss,
  COUNT(DISTINCT phase) as fases_com_boss
FROM boss_battles;

-- PASSO 6: Ver estrutura completa de uma fase (exemplo: Fase 1)
-- ========================================
SELECT 
  q.order_index,
  q.name,
  q.description,
  q.deliverable_type,
  q.max_points,
  q.planned_deadline_minutes,
  q.status,
  CASE 
    WHEN q.order_index = 4 THEN '🎯 PROVÁVEL BOSS'
    ELSE '📝 Quest Normal'
  END as tipo_sugerido
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;

-- ========================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- ========================================
-- Se PASSO 1 mostrar "4 quests" por fase → provavelmente 3 normais + 1 BOSS
-- Se PASSO 3 retornar resultados → BOSS já existe com nome identificável
-- Se PASSO 4 mostrar quest com order_index=4 → essa é a quest BOSS
-- Se PASSO 5 mostrar 0 registros → boss_battles é só para avaliação, não para quests
