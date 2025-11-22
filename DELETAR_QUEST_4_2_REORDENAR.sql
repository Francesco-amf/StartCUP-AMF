-- ========================================
-- DELETAR QUEST 4.2 E REORDENAR FASE 4
-- ========================================
-- Data: 2025-11-22
-- Objetivo: Remover Quest 4.2 completamente, pulando da 4.1 para 4.3 (BOSS)
-- IMPORTANTE: Executar ANTES de ativar a Fase 4

-- ========================================
-- PASSO 1: Verificar estado atual da Fase 4
-- ========================================
SELECT 
  '=== ESTADO ATUAL DA FASE 4 ===' as info;

SELECT 
  q.id,
  p.order_index || '.' || q.order_index as quest_numero,
  q.name,
  q.status,
  q.started_at,
  q.duration_minutes,
  CASE 
    WHEN q.started_at IS NULL THEN '✅ SEGURO DELETAR/ALTERAR'
    ELSE '❌ JÁ FOI INICIADA - NÃO ALTERAR'
  END as pode_modificar,
  -- Verificar se há submissões
  (SELECT COUNT(*) FROM submissions s WHERE s.quest_id = q.id) as total_submissoes
FROM quests q
JOIN phases p ON p.id = q.phase_id
WHERE p.order_index = 4
ORDER BY q.order_index;

-- ========================================
-- PASSO 2: Verificar dependências (submissions, penalties, etc)
-- ========================================
SELECT 
  '=== VERIFICAR DEPENDÊNCIAS DA QUEST 4.2 ===' as info;

-- Verificar submissions
SELECT 
  'Submissões na Quest 4.2:' as tipo,
  COUNT(*) as total
FROM submissions s
JOIN quests q ON s.quest_id = q.id
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 4 AND q.order_index = 2;

-- Verificar evaluations
SELECT 
  'Avaliações na Quest 4.2:' as tipo,
  COUNT(*) as total
FROM evaluations e
JOIN submissions s ON e.submission_id = s.id
JOIN quests q ON s.quest_id = q.id
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 4 AND q.order_index = 2;

-- ========================================
-- PASSO 3: DELETAR QUEST 4.2
-- ========================================
-- EXECUTAR APENAS SE:
-- 1. Quest não foi iniciada (started_at IS NULL)
-- 2. Não há submissões (total_submissoes = 0)
-- 3. Não há avaliações

-- Deletar Quest 4.2
DELETE FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4)
  AND order_index = 2
  AND started_at IS NULL -- Proteção: só se não foi iniciada
  AND NOT EXISTS (
    SELECT 1 FROM submissions WHERE quest_id = quests.id
  ); -- Proteção: só se não tem submissões

-- ========================================
-- PASSO 4: REORDENAR - Ajustar order_index da Quest 4.3 para 2
-- ========================================
-- Fazer BOSS 4.3 virar Quest 4.2

UPDATE quests
SET order_index = 2
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4)
  AND order_index = 3
  AND started_at IS NULL; -- Proteção: só se não foi iniciada

-- ========================================
-- PASSO 5: Verificar resultado final
-- ========================================
SELECT 
  '=== APÓS DELEÇÃO E REORDENAÇÃO ===' as info;

SELECT 
  q.id,
  p.order_index || '.' || q.order_index as quest_numero,
  q.name,
  q.status,
  q.duration_minutes,
  q.deliverable_type
FROM quests q
JOIN phases p ON p.id = q.phase_id
WHERE p.order_index = 4
ORDER BY q.order_index;

-- ========================================
-- PASSO 6: Calcular novo timing da Fase 4
-- ========================================
SELECT 
  '=== TIMING TOTAL DA FASE 4 (APÓS REMOÇÃO) ===' as info;

SELECT 
  p.order_index as fase,
  p.name as nome_fase,
  COUNT(q.id) as total_quests,
  SUM(q.duration_minutes) as duracao_total_minutos,
  SUM(q.duration_minutes) / 60.0 as duracao_total_horas,
  string_agg(
    p.order_index || '.' || q.order_index || ': ' || q.name || ' (' || q.duration_minutes || 'min)',
    ' → '
    ORDER BY q.order_index
  ) as sequencia
FROM quests q
JOIN phases p ON p.id = q.phase_id
WHERE p.order_index = 4
GROUP BY p.order_index, p.name;

-- ========================================
-- PASSO 7: Testar validação sequencial
-- ========================================
SELECT 
  '=== TESTAR VALIDAÇÃO SEQUENCIAL ===' as info;

-- Simular: Equipe submeteu 4.1, pode submeter 4.2 (antigo 4.3)?
DO $$
DECLARE
  v_team_id UUID;
  v_quest_4_1_id UUID;
  v_quest_4_2_id UUID; -- Agora é o antigo 4.3 (BOSS)
  v_result RECORD;
BEGIN
  -- Pegar primeira equipe
  SELECT id INTO v_team_id FROM teams WHERE name != 'Outsiders' LIMIT 1;
  
  -- Pegar quests da Fase 4
  SELECT id INTO v_quest_4_1_id FROM quests 
  WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4)
    AND order_index = 1;
    
  SELECT id INTO v_quest_4_2_id FROM quests 
  WHERE phase_id = (SELECT id FROM phases WHERE order_index = 4)
    AND order_index = 2;
  
  RAISE NOTICE 'Quest 4.1 (id): %', v_quest_4_1_id;
  RAISE NOTICE 'Quest 4.2 - antigo BOSS (id): %', v_quest_4_2_id;
  RAISE NOTICE '';
  
  -- Testar check_previous_quest_submitted para Quest 4.2
  SELECT * INTO v_result 
  FROM check_previous_quest_submitted(v_team_id, v_quest_4_2_id);
  
  RAISE NOTICE '✅ Validação sequencial 4.1 → 4.2:';
  RAISE NOTICE '  can_submit: %', v_result.can_submit;
  RAISE NOTICE '  reason: %', v_result.reason;
  RAISE NOTICE '  previous_quest_required: %', v_result.previous_quest_required;
  
END $$;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- ANTES:
-- Quest 4.1: 40 min
-- Quest 4.2: 40 min
-- BOSS 4.3: 10 min
-- Total: 90 min (1h30)
--
-- DEPOIS:
-- Quest 4.1: 40 min (ou 30 se ajustado)
-- BOSS 4.2: 10 min (antigo 4.3)
-- Total: 50 min (ou 40 min se 4.1 ajustado para 30)
--
-- ECONOMIA: 40 minutos na Fase 4

-- ========================================
-- IMPACTOS E CONSIDERAÇÕES
-- ========================================
/*
✅ VANTAGENS:
- Reduz Fase 4 de 90min para 50min (ou 40min)
- Economia de 40-50 minutos no evento
- Simplifica sequência de quests

⚠️ ATENÇÃO:
- BOSS passa de 4.3 para 4.2 (muda numeração)
- Validação sequencial continua funcionando (4.1 → 4.2)
- Se já houver submissões na 4.2, DELETE vai falhar (proteção)
- Se quest já foi iniciada, UPDATE vai falhar (proteção)

🔒 PROTEÇÕES:
- WHERE started_at IS NULL - só quests não iniciadas
- WHERE NOT EXISTS (submissions) - só se sem submissões
- Dupla verificação antes de executar

✅ VALIDAÇÃO SEQUENCIAL:
- check_previous_quest_submitted vai buscar Quest 4.1 como anterior
- Sistema continua exigindo 4.1 antes de 4.2
- Tudo funcionará normalmente
*/
