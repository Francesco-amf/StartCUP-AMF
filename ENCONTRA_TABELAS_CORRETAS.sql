-- Encontrar todas as tabelas e verificar qual armazena o estado de fase atual

-- PASSO 1: LISTAR TODAS AS TABELAS
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- PASSO 2: PROCURAR POR COLUNAS QUE MENCIONEM "PHASE" OU "CURRENT"
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name ILIKE '%phase%' OR column_name ILIKE '%current%'
ORDER BY table_name, column_name;

-- PASSO 3: VERIFICAR ESTRUTURA DA TABELA teams
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'teams'
ORDER BY ordinal_position;

-- PASSO 4: VERIFICAR ESTRUTURA DA TABELA phases
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'phases'
ORDER BY ordinal_position;

-- PASSO 5: VER OS DADOS - ESTADO ATUAL DE MISTOS
SELECT * FROM teams WHERE name = 'Mistos';
SELECT * FROM phases WHERE team_id = (SELECT id FROM teams WHERE name = 'Mistos');
SELECT * FROM quests WHERE team_id = (SELECT id FROM teams WHERE name = 'Mistos') LIMIT 20;
