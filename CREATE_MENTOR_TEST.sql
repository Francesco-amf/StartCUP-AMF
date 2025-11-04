-- ==========================================
-- 🔍 VERIFICAR E CRIAR MENTOR DE TESTE
-- ==========================================

-- 1. Verificar se existem mentores
SELECT 
  id,
  name,
  email,
  course,
  created_at
FROM teams
WHERE course = 'Avaliação';

-- 2. Se não houver mentores, criar um mentor de teste
-- IMPORTANTE: Ajuste o email e nome conforme necessário

-- Verificar se o email já existe (para evitar duplicatas)
-- SELECT * FROM teams WHERE email = 'mentor1@test.com';

-- Criar mentor de teste (execute apenas se não existir)
INSERT INTO teams (email, name, course)
VALUES ('mentor1@test.com', 'Prof. João Silva', 'Avaliação')
ON CONFLICT (email) DO UPDATE 
SET course = 'Avaliação', name = 'Prof. João Silva';

-- 3. Verificar novamente após criar
SELECT 
  id,
  name,
  email,
  course,
  created_at
FROM teams
WHERE course = 'Avaliação'
ORDER BY name;

-- ==========================================
-- 💡 ALTERNATIVA: Converter avaliador existente
-- ==========================================
-- Se você já tem avaliadores criados anteriormente,
-- pode convertê-los para mentores:

-- Ver avaliadores existentes
SELECT email, name, course FROM teams 
WHERE email LIKE '%avaliador%' OR email LIKE '%evaluator%';

-- Converter avaliador para mentor (descomente e ajuste o email)
-- UPDATE teams 
-- SET course = 'Avaliação' 
-- WHERE email = 'avaliador1@test.com';

-- ==========================================
-- 📋 OPÇÕES DE CRIAÇÃO EM MASSA
-- ==========================================
-- Criar múltiplos mentores de uma vez:

INSERT INTO teams (email, name, course)
VALUES 
  ('mentor1@test.com', 'Prof. João Silva', 'Avaliação'),
  ('mentor2@test.com', 'Profa. Maria Santos', 'Avaliação'),
  ('mentor3@test.com', 'Prof. Pedro Costa', 'Avaliação')
ON CONFLICT (email) DO UPDATE 
SET course = 'Avaliação';
