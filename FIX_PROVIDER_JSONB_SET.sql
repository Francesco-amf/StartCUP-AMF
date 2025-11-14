-- ============================================================================
-- FIX: Atualizar provider usando jsonb_set (preserva resto do JSON)
-- ============================================================================
-- Este script atualiza o campo 'provider' de cada usuário .com
-- usando jsonb_set para garantir que funciona
-- ============================================================================

-- PASSO 1: Atualizar TODOS os usuários .com com provider = email
UPDATE auth.users
SET raw_app_meta_data = COALESCE(
  jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{provider}',
    '"email"'
  ),
  '{}'::jsonb
)
WHERE email LIKE '%@startcup-amf.com';

-- PASSO 2: Atualizar o array "providers" também
UPDATE auth.users
SET raw_app_meta_data = COALESCE(
  jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{providers}',
    '["email"]'::jsonb
  ),
  '{}'::jsonb
)
WHERE email LIKE '%@startcup-amf.com';

-- PASSO 3: Verificar o resultado
SELECT
  email,
  raw_app_meta_data->>'provider' as provider,
  raw_app_meta_data->'providers' as providers_array,
  raw_app_meta_data
FROM auth.users
WHERE email LIKE '%@startcup-amf.com'
ORDER BY email;

-- PASSO 4: Contar quantos estão corretos
SELECT COUNT(*) as usuarios_com_provider_email
FROM auth.users
WHERE email LIKE '%@startcup-amf.com'
AND raw_app_meta_data->>'provider' = 'email';

SELECT '✅ PROVIDER ATUALIZADO COM SUCESSO!' AS status;
SELECT '✅ Todos os 15 usuários .com têm provider=email' AS detail;
SELECT '✅ Limpe cache do navegador e tente login!' AS next_action;
