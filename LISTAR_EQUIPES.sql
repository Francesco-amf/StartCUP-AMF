-- ==================================================
-- 📋 LISTAR TODAS AS EQUIPES CADASTRADAS
-- ==================================================
-- Execute no Supabase SQL Editor para ver todas as equipes
-- ==================================================

-- ========================================
-- LISTAGEM COMPLETA
-- ========================================
SELECT 
  id,
  name AS "Nome da Equipe",
  email AS "Email",
  course AS "Curso",
  members AS "Membros (JSON)",
  created_at AS "Data de Cadastro",
  logo_url AS "Logo URL"
FROM teams
ORDER BY created_at DESC;

-- ========================================
-- LISTAGEM SIMPLIFICADA (Mais Legível)
-- ========================================
SELECT 
  name AS "Equipe",
  email AS "Email",
  course AS "Curso",
  CASE 
    WHEN course = 'Administration' THEN '👑 Admin'
    WHEN course = 'Avaliação' THEN '⚖️ Avaliador'
    ELSE '🎯 Equipe'
  END AS "Tipo",
  CASE 
    WHEN members IS NOT NULL THEN jsonb_array_length(members)
    ELSE 0
  END AS "Nº Membros",
  CASE 
    WHEN logo_url IS NOT NULL THEN '✅ Tem'
    ELSE '❌ Sem logo'
  END AS "Logo",
  created_at::date AS "Cadastro"
FROM teams
ORDER BY 
  CASE 
    WHEN course = 'Administration' THEN 1
    WHEN course = 'Avaliação' THEN 2
    ELSE 3
  END,
  created_at DESC;

-- ========================================
-- ESTATÍSTICAS
-- ========================================
SELECT 
  COUNT(*) AS "Total Geral",
  COUNT(*) FILTER (WHERE course = 'Administration') AS "👑 Admin",
  COUNT(*) FILTER (WHERE course = 'Avaliação') AS "⚖️ Avaliadores",
  COUNT(*) FILTER (WHERE course NOT IN ('Administration', 'Avaliação')) AS "🎯 Equipes Competidoras",
  COUNT(DISTINCT course) FILTER (WHERE course NOT IN ('Administration', 'Avaliação')) AS "Cursos Diferentes",
  SUM(CASE WHEN logo_url IS NOT NULL THEN 1 ELSE 0 END) AS "Com Logo",
  SUM(CASE WHEN logo_url IS NULL THEN 1 ELSE 0 END) AS "Sem Logo"
FROM teams;

-- ========================================
-- EQUIPES POR CURSO
-- ========================================
SELECT 
  course AS "Curso",
  COUNT(*) AS "Quantidade de Equipes"
FROM teams
GROUP BY course
ORDER BY COUNT(*) DESC;

-- ========================================
-- SEPARAR: ADMIN + AVALIADORES vs EQUIPES
-- ========================================

-- 👑 ADMIN
SELECT 
  name AS "Nome",
  email AS "Email",
  created_at::date AS "Cadastro"
FROM teams
WHERE course = 'Administration';

-- ⚖️ AVALIADORES
SELECT 
  name AS "Nome",
  email AS "Email",
  created_at::date AS "Cadastro"
FROM teams
WHERE course = 'Avaliação'
ORDER BY name;

-- 🎯 EQUIPES COMPETIDORAS (excluindo admin e avaliadores)
SELECT 
  name AS "Equipe",
  email AS "Email",
  course AS "Curso",
  CASE 
    WHEN members IS NOT NULL THEN jsonb_array_length(members)
    ELSE 0
  END AS "Nº Membros",
  created_at::date AS "Cadastro"
FROM teams
WHERE course NOT IN ('Administration', 'Avaliação')
ORDER BY created_at DESC;

-- ========================================
-- DETALHES DOS MEMBROS (Se precisar ver quem são)
-- ========================================
-- Descomente para ver detalhes de membros de cada equipe:
/*
SELECT 
  t.name AS "Equipe",
  t.course AS "Curso",
  jsonb_array_elements(t.members)->>'name' AS "Nome do Membro",
  jsonb_array_elements(t.members)->>'email' AS "Email do Membro"
FROM teams t
WHERE t.members IS NOT NULL
ORDER BY t.name;
*/

-- ========================================
-- BUSCAR EQUIPE ESPECÍFICA
-- ========================================
-- Exemplo: buscar equipe pelo nome
-- Substitua 'Nome da Equipe' pelo nome que procura:
/*
SELECT 
  id,
  name,
  email,
  course,
  members,
  logo_url,
  created_at
FROM teams
WHERE name ILIKE '%nome%'  -- busca parcial, case-insensitive
   OR email ILIKE '%email%';
*/
