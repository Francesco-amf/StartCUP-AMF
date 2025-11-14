-- ============================================================================
-- CRIAR REGISTROS DE AVALIADORES NA TABELA evaluators
-- ============================================================================
-- Este script insere os 15 avaliadores na tabela evaluators do banco de dados
-- Isto é necessário porque os usuários foram criados no Auth mas não na tabela de dados
-- ============================================================================

-- PASSO 1: Limpar registros antigos (opcional)
DELETE FROM evaluators WHERE email LIKE '%@startcup-amf.com';

-- PASSO 2: Inserir os 15 avaliadores
INSERT INTO evaluators (id, email, name, specialty, is_online) VALUES
-- Buscar o UUID do auth.users para cada avaliador
(
  (SELECT id FROM auth.users WHERE email = 'natalia.santos@startcup-amf.com'),
  'natalia.santos@startcup-amf.com',
  'Natália Santos',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'eloi.brandt@startcup-amf.com'),
  'eloi.brandt@startcup-amf.com',
  'Eloi Brandt',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'wilian.neu@startcup-amf.com'),
  'wilian.neu@startcup-amf.com',
  'Wilian Neu',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'clarissa.miranda@startcup-amf.com'),
  'clarissa.miranda@startcup-amf.com',
  'Clarissa Miranda',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'aline.rospa@startcup-amf.com'),
  'aline.rospa@startcup-amf.com',
  'Aline Rospa',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'patricia.dias@startcup-amf.com'),
  'patricia.dias@startcup-amf.com',
  'Patrícia Dias',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'rafaela.tagliapietra@startcup-amf.com'),
  'rafaela.tagliapietra@startcup-amf.com',
  'Rafaela Tagliapietra',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'francesco.santini@startcup-amf.com'),
  'francesco.santini@startcup-amf.com',
  'Francesco Santini',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'douglas.garlet@startcup-amf.com'),
  'douglas.garlet@startcup-amf.com',
  'Douglas Garlet',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'kauan.goncalves@startcup-amf.com'),
  'kauan.goncalves@startcup-amf.com',
  'Kauan Gonçalves',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'angelo.tissot@startcup-amf.com'),
  'angelo.tissot@startcup-amf.com',
  'Ângelo Tissot',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'marcelo.medeiros@startcup-amf.com'),
  'marcelo.medeiros@startcup-amf.com',
  'Marcelo Medeiros',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'pedro.hermes@startcup-amf.com'),
  'pedro.hermes@startcup-amf.com',
  'Pedro Hermes',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'augusto@startcup-amf.com'),
  'augusto@startcup-amf.com',
  'Augusto',
  NULL,
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'gustavo.florencio@startcup-amf.com'),
  'gustavo.florencio@startcup-amf.com',
  'Gustavo Florêncio',
  NULL,
  false
);

-- PASSO 3: Verificar se foram inseridos corretamente
SELECT COUNT(*) as total_avaliadores FROM evaluators WHERE email LIKE '%@startcup-amf.com';

SELECT email, name FROM evaluators WHERE email LIKE '%@startcup-amf.com' ORDER BY name;

SELECT '✅ AVALIADORES CRIADOS COM SUCESSO!' AS status;
