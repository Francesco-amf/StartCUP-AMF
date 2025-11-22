-- ========================================
-- ANÁLISE RÁPIDA: QUEM PODE E QUEM NÃO PODE SUBMETER
-- ========================================
-- Data: 2025-11-22

-- Quest ativa atual
WITH active_quest AS (
  SELECT 
    q.id,
    q.name,
    q.phase_id,
    q.order_index,
    p.order_index as phase_order
  FROM quests q
  JOIN phases p ON p.id = q.phase_id
  WHERE q.status = 'active'
  ORDER BY q.started_at DESC
  LIMIT 1
),
-- Quests anteriores na mesma fase
previous_quests AS (
  SELECT q.id, q.order_index
  FROM quests q
  JOIN active_quest aq ON q.phase_id = aq.phase_id
  WHERE q.order_index < (SELECT order_index FROM active_quest)
),
-- Análise por equipe
team_status AS (
  SELECT 
    t.id as team_id,
    t.name as team_name,
    aq.id as active_quest_id,
    aq.name as active_quest_name,
    aq.phase_order || '.' || aq.order_index as quest_atual,
    -- Verificar se já submeteu a quest atual
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM submissions s 
        WHERE s.team_id = t.id AND s.quest_id = aq.id
      ) THEN '❌ JÁ SUBMETEU'
      ELSE '✅ Ainda não submeteu'
    END as status_quest_atual,
    -- Verificar quests anteriores pendentes
    (
      SELECT string_agg(pq.order_index::text, ', ')
      FROM previous_quests pq
      WHERE NOT EXISTS (
        SELECT 1 FROM submissions s
        WHERE s.team_id = t.id AND s.quest_id = pq.id
      )
    ) as quests_anteriores_pendentes,
    -- Determinar se PODE submeter
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM submissions s 
        WHERE s.team_id = t.id AND s.quest_id = aq.id
      ) THEN '❌ NÃO PODE (já submeteu)'
      WHEN EXISTS (
        SELECT 1 FROM previous_quests pq
        WHERE NOT EXISTS (
          SELECT 1 FROM submissions s
          WHERE s.team_id = t.id AND s.quest_id = pq.id
        )
      ) THEN '❌ NÃO PODE (quest anterior pendente)'
      ELSE '✅ PODE SUBMETER'
    END as pode_submeter
  FROM teams t
  CROSS JOIN active_quest aq
)
SELECT 
  team_name as equipe,
  quest_atual,
  active_quest_name as nome_quest,
  status_quest_atual,
  COALESCE(quests_anteriores_pendentes, '✅ Nenhuma') as quests_pendentes,
  pode_submeter
FROM team_status
ORDER BY 
  CASE 
    WHEN pode_submeter LIKE '✅%' THEN 1
    ELSE 2
  END,
  team_name;

-- ========================================
-- RESUMO
-- ========================================
SELECT 
  '=== RESUMO ===' as info;

WITH active_quest AS (
  SELECT id FROM quests WHERE status = 'active' ORDER BY started_at DESC LIMIT 1
),
stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE pode_submeter = '✅ PODE SUBMETER') as podem_submeter,
    COUNT(*) FILTER (WHERE pode_submeter LIKE '%já submeteu%') as ja_submeteram,
    COUNT(*) FILTER (WHERE pode_submeter LIKE '%quest anterior%') as bloqueadas_sequencial,
    COUNT(*) as total_equipes
  FROM (
    SELECT 
      t.id,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM submissions s 
          WHERE s.team_id = t.id AND s.quest_id = aq.id
        ) THEN '❌ NÃO PODE (já submeteu)'
        WHEN EXISTS (
          SELECT 1 FROM quests pq
          JOIN active_quest aq2 ON pq.phase_id = (SELECT phase_id FROM quests WHERE id = aq.id)
          WHERE pq.order_index < (SELECT order_index FROM quests WHERE id = aq.id)
            AND NOT EXISTS (
              SELECT 1 FROM submissions s
              WHERE s.team_id = t.id AND s.quest_id = pq.id
            )
        ) THEN '❌ NÃO PODE (quest anterior pendente)'
        ELSE '✅ PODE SUBMETER'
      END as pode_submeter
    FROM teams t
    CROSS JOIN active_quest aq
  ) sub
)
SELECT 
  'Equipes que PODEM submeter: ' || podem_submeter || '/' || total_equipes as linha1,
  'Equipes que JÁ submeteram: ' || ja_submeteram || '/' || total_equipes as linha2,
  'Equipes BLOQUEADAS (quest anterior): ' || bloqueadas_sequencial || '/' || total_equipes as linha3
FROM stats;
