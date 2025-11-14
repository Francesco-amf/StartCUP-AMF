-- ============================================================================
-- UPDATE DIRETO: Atualiza o provider dos usuários existentes
-- ============================================================================
-- Em vez de recriar, vamos atualizar o raw_app_meta_data diretamente
-- para garantir que o provider está correto
-- ============================================================================

-- PASSO 1: Primeiro, limpar todos os .local users
DELETE FROM public.teams WHERE email LIKE '%@startcup.local';
DELETE FROM auth.users WHERE email LIKE '%@startcup.local';

-- PASSO 2: Atualizar raw_app_meta_data de TODOS os usuarios .com
-- para garantir que têm o provider correto
UPDATE auth.users
SET raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb
WHERE email LIKE '%@startcup-amf.com';

-- PASSO 3: Verificar que foi atualizado
SELECT email, raw_app_meta_data->>'provider' as provider_type, created_at
FROM auth.users
WHERE email LIKE '%@startcup-amf.com'
ORDER BY email;

-- PASSO 4: Contar quantos têm o provider correto agora
SELECT COUNT(*) as usuarios_com_provider_correto
FROM auth.users
WHERE email LIKE '%@startcup-amf.com'
AND raw_app_meta_data->>'provider' = 'email';

SELECT '✅ PROVIDERS ATUALIZADOS!' AS status;
SELECT '✅ Todos os usuários .com agora têm Email provider' AS detail;
SELECT '✅ Tente fazer login novamente!' AS next_step;
