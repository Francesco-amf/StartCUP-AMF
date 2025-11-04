-- ==========================================
-- 🔍 DIAGNÓSTICO COMPLETO - MENTORES
-- ==========================================

-- 1. Ver TODOS os registros da tabela teams (sem filtro)
SELECT id, name, email, course, created_at
FROM teams
ORDER BY course, name;

-- 2. Contar quantos registros existem por course
SELECT 
  course,
  COUNT(*) as quantidade
FROM teams
GROUP BY course
ORDER BY course;

-- 3. Verificar especificamente por 'Avaliação' (pode ter encoding diferente)
SELECT id, name, email, course, created_at
FROM teams
WHERE course LIKE '%valia%'  -- Busca flexível
ORDER BY name;

-- 4. Ver os valores EXATOS de course (pode ter espaços ou caracteres estranhos)
SELECT DISTINCT 
  course,
  LENGTH(course) as tamanho,
  ASCII(SUBSTRING(course, 1, 1)) as primeiro_char_ascii
FROM teams
ORDER BY course;

-- ==========================================
-- 🔧 CRIAR MENTOR AGORA (copie e execute separadamente)
-- ==========================================
-- Execute este bloco para criar um mentor de teste:

INSERT INTO teams (email, name, course)
VALUES ('mentor.teste@startcup.com', 'Prof. Mentor Teste', 'Avaliação')
ON CONFLICT (email) DO UPDATE 
SET course = 'Avaliação', name = 'Prof. Mentor Teste'
RETURNING id, name, email, course;

-- Verificar se foi criado:
SELECT id, name, email, course 
FROM teams 
WHERE email = 'mentor.teste@startcup.com';
