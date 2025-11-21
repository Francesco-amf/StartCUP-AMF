-- Adicionar Jessica Baratto como Avaliadora/Mentora
-- Email: jessica.baratto@startcup-amf.com
-- Senha: JBEvaluator@2025!

-- PASSO 1: Criar usuário no auth.users (via Supabase Dashboard)
-- Ir para: Authentication > Users > Invite User
-- Email: jessica.baratto@startcup-amf.com
-- Senha temporária ou enviar convite

-- PASSO 2: Executar este SQL após criar o usuário

-- Buscar o UUID do usuário criado
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Buscar o ID do usuário pelo email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'jessica.baratto@startcup-amf.com';

    -- Se não encontrou, mostrar erro
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado! Crie o usuário primeiro no Authentication > Users';
    END IF;

    -- Inserir na tabela users
    INSERT INTO users (id, name, email, role)
    VALUES (
        v_user_id,
        'Jessica Baratto',
        'jessica.baratto@startcup-amf.com',
        'evaluator'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = EXCLUDED.name,
        role = EXCLUDED.role;

    RAISE NOTICE 'Avaliadora Jessica Baratto adicionada com sucesso! ID: %', v_user_id;
END $$;

-- Verificar se foi criado corretamente
SELECT id, name, email, role, created_at
FROM users
WHERE email = 'jessica.baratto@startcup-amf.com';
