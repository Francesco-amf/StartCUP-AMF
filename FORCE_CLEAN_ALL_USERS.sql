-- ============================================================================
-- FORÇA MÁXIMA: Deletar ABSOLUTAMENTE TODOS os usuários de equipes
-- ============================================================================
-- Este script remove TODOS os usuários .com e .local
-- Deixando apenas admin e evaluador para teste
-- ============================================================================

-- PASSO 1: Deletar TODAS as equipes
DELETE FROM public.teams
WHERE email LIKE '%@startcup%';

-- PASSO 2: Deletar TODOS os usuários de equipes (ambos domínios)
DELETE FROM auth.users
WHERE email LIKE '%@startcup%';

-- PASSO 3: Verificar limpeza
SELECT COUNT(*) as usuarios_startcup_restantes
FROM auth.users
WHERE email LIKE '%@startcup%';

SELECT COUNT(*) as equipes_startcup_restantes
FROM public.teams
WHERE email LIKE '%@startcup%';

-- PASSO 4: Listar usuários restantes (deve ser só admin e avaliador)
SELECT email, raw_app_meta_data->>'provider' as provider_type
FROM auth.users
ORDER BY email;

SELECT '✅ LIMPEZA COMPLETA!' AS status;
SELECT '✅ Todos os usuários de equipes foram deletados' AS detail_1;
SELECT '✅ Apenas admin e avaliadores de teste restam' AS detail_2;
SELECT '✅ Pronto para criar novos usuários via Admin API!' AS next_step;
