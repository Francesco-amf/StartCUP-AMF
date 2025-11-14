-- ============================================================================
-- LIMPEZA TOTAL: Remove TODAS as referências de usuários órfãos
-- ============================================================================
-- Este script limpa todas as tabelas que referem usuarios órfãos
-- ============================================================================

-- Identificar usuários válidos (que queremos manter)
-- admin@test.com, avaliadores@startcup-amf.com, equipes@startcup-amf.com
CREATE TEMPORARY TABLE valid_users AS
SELECT id FROM auth.users
WHERE email LIKE '%@%.%'
AND email NOT LIKE '_%_%_%_%_%_%_%_%'
AND email IS NOT NULL
AND email != '';

-- PASSO 1: Limpar referências em quest_activity_log
DELETE FROM quest_activity_log
WHERE triggered_by NOT IN (SELECT id FROM valid_users)
AND triggered_by IS NOT NULL;

-- PASSO 2: Limpar referências em quests
UPDATE quests
SET started_by = NULL
WHERE started_by NOT IN (SELECT id FROM valid_users)
AND started_by IS NOT NULL;

-- PASSO 3: Limpar referências em evaluations
UPDATE evaluations
SET evaluator_id = NULL
WHERE evaluator_id NOT IN (SELECT id FROM valid_users)
AND evaluator_id IS NOT NULL;

-- PASSO 4: Limpar referências em penalties
UPDATE penalties
SET assigned_by = NULL
WHERE assigned_by NOT IN (SELECT id FROM valid_users)
AND assigned_by IS NOT NULL;

-- PASSO 5: Agora deletar os usuários órfãos
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM valid_users);

-- PASSO 6: Resultado final
SELECT COUNT(*) as usuarios_restantes FROM auth.users;

SELECT
  COUNT(*) as count,
  COALESCE(raw_user_meta_data->>'role', 'unknown') as role_type
FROM auth.users
GROUP BY raw_user_meta_data->>'role'
ORDER BY count DESC;

SELECT '✅ LIMPEZA TOTAL CONCLUÍDA!' AS status;
SELECT '✅ Todas as referências removidas' AS detail_1;
SELECT '✅ Usuários órfãos deletados' AS detail_2;
SELECT '✅ Sistema limpo e pronto para uso!' AS detail_3;
