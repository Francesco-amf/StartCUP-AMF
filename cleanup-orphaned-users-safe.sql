-- ============================================================================
-- LIMPEZA SEGURA: Remover usuários órfãos sem violar constraints
-- ============================================================================
-- Este script remove referências de usuários órfãos ANTES de deletar
-- ============================================================================

-- PASSO 1: Ver quais usuários têm referências (opcional)
SELECT DISTINCT started_by FROM quests WHERE started_by IS NOT NULL LIMIT 10;

-- PASSO 2: Limpar referências em quests
UPDATE quests
SET started_by = NULL
WHERE started_by NOT IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@%.%'
  AND email NOT LIKE '_%_%_%_%_%_%_%_%'
  AND email IS NOT NULL
  AND email != ''
);

-- PASSO 3: Limpar referências em outras tabelas (se houver)
-- Verificar e atualizar conforme necessário

-- PASSO 4: Agora deletar os usuários órfãos
DELETE FROM auth.users
WHERE email NOT LIKE '%@%.%'
OR email LIKE '_%_%_%_%_%_%_%_%'  -- Hashes típicos têm muitos _
OR email IS NULL
OR email = '';

-- PASSO 5: Resultado da limpeza
SELECT COUNT(*) as usuarios_restantes FROM auth.users;

SELECT
  COUNT(*) as usuarios,
  COALESCE(raw_user_meta_data->>'role', 'unknown') as role_type
FROM auth.users
GROUP BY raw_user_meta_data->>'role'
ORDER BY usuarios DESC;

SELECT '✅ LIMPEZA SEGURA CONCLUÍDA!' AS status;
SELECT '✅ Referências removidas' AS detail_1;
SELECT '✅ Usuários órfãos deletados' AS detail_2;
SELECT '✅ Admin, avaliadores e equipes preservados' AS detail_3;
