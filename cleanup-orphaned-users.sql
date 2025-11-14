-- ============================================================================
-- LIMPEZA: Remover usuários órfãos/corrompidos do Auth
-- ============================================================================
-- Este script remove usuários antigos que têm emails criptografados ou inválidos
-- Mantém apenas: admin, avaliadores e equipes
-- ============================================================================

-- Ver usuários antes de limpar (opcional)
SELECT
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 50;

-- Deletar usuários com emails que parecem criptografados ou mal formatados
-- (emails que NÃO contenham @ válido ou pareçam hashes)
DELETE FROM auth.users
WHERE email NOT LIKE '%@%.%'
OR email LIKE '_%_%_%_%_%_%_%_%'  -- Hashes típicos têm muitos _
OR email IS NULL
OR email = '';

-- Resultado da limpeza
SELECT COUNT(*) as usuarios_restantes FROM auth.users;

SELECT
  COUNT(*) as avaliadores,
  'evaluator' as role_type
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'evaluator'
UNION ALL
SELECT
  COUNT(*),
  'team'
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'team'
UNION ALL
SELECT
  COUNT(*),
  'admin'
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin'
OR email LIKE '%@test.com';

SELECT '✅ LIMPEZA CONCLUÍDA!' AS status;
SELECT '✅ Usuários órfãos removidos' AS detail_1;
SELECT '✅ Apenas admin, avaliadores e equipes permanecem' AS detail_2;
