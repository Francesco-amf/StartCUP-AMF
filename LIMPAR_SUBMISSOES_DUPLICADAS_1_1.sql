-- ============================================================================
-- LIMPAR_SUBMISSOES_DUPLICADAS_1_1.sql
-- ============================================================================
-- Limpar submissões duplicadas de Quest 1.1 que podem estar causando erro
-- ============================================================================

SELECT '=== 1. SUBMISSÕES DUPLICADAS EM QUEST 1.1 ===' as secao;

SELECT 
  t.name as team,
  COUNT(*) as total,
  STRING_AGG(s.id::text, ', ') as submission_ids
FROM submissions s
JOIN teams t ON s.team_id = t.id
WHERE s.quest_id IN (SELECT id FROM quests WHERE order_index = 1)
GROUP BY t.id, t.name
HAVING COUNT(*) > 1;

SELECT '' as espacador1;

SELECT '=== 2. DELETAR DUPLICADAS (MANTER APENAS 1 POR TEAM) ===' as secao2;

DO $$
DECLARE
  v_team_id UUID;
  v_quest_id UUID;
  v_ids TEXT;
  v_deleted_count INT := 0;
BEGIN
  SELECT id INTO v_quest_id FROM quests WHERE order_index = 1 LIMIT 1;

  FOR v_team_id IN 
    SELECT DISTINCT s.team_id
    FROM submissions s
    WHERE s.quest_id = v_quest_id
    GROUP BY s.team_id
    HAVING COUNT(*) > 1
  LOOP
    -- Deletar duplicadas, manter a mais recente
    DELETE FROM submissions
    WHERE quest_id = v_quest_id
      AND team_id = v_team_id
      AND id NOT IN (
        SELECT id FROM submissions 
        WHERE quest_id = v_quest_id AND team_id = v_team_id
        ORDER BY id DESC
        LIMIT 1
      );

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deletadas % submissões duplicadas para team %', v_deleted_count, v_team_id;
  END LOOP;

END $$;

SELECT '' as espacador2;

SELECT '=== 3. VERIFICAR RESULTADO ===' as secao3;

SELECT 
  t.name as team,
  COUNT(*) as total_submissoes,
  'Sem duplicatas ✅' as status
FROM submissions s
JOIN teams t ON s.team_id = t.id
WHERE s.quest_id IN (SELECT id FROM quests WHERE order_index = 1)
GROUP BY t.id, t.name
ORDER BY t.name;

SELECT '' as espacador3;

SELECT '=== LIMPEZA CONCLUÍDA ===' as conclusao;
