-- ==========================================
-- CRIAR EQUIPE DE TESTE PARA VALIDAÇÃO
-- ==========================================
-- Execute este script no Supabase SQL Editor para criar
-- uma equipe de teste que você pode usar para testar o sistema

-- 1. Criar uma equipe de teste
INSERT INTO teams (
  name,
  email,
  course,
  members,
  created_at,
  updated_at
)
VALUES (
  'Equipe Teste StartCup',
  'test-team@startcup.local',
  'Engenharia de Software',
  'João Silva, Maria Santos, Pedro Costa',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING
RETURNING id, name, email;

-- 2. Listar a equipe criada
SELECT 'Equipe criada com sucesso!' as status;
SELECT id, name, email, course FROM teams WHERE email = 'test-team@startcup.local';

-- 3. Informações para login
SELECT 'Use os seguintes dados para login:' as info;
SELECT 'Email: test-team@startcup.local' as credential;
SELECT 'Nota: Primeiro crie o usuário no Supabase Auth com este email e uma senha' as note;
