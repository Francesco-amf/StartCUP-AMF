-- ============================================================================
-- FIX: Transformar Avaliadores em Mentores
-- ============================================================================
-- Problema: Nenhum avaliador tem role='mentor', então lista fica vazia
-- Solução: Atualizar alguns avaliadores para terem role='mentor'
-- ============================================================================

-- OPÇÃO 1: Fazer TODOS os avaliadores também serem mentores
UPDATE evaluators
SET role = 'mentor'
WHERE role = 'evaluator' OR role IS NULL;

-- OPÇÃO 2: Atualizar apenas alguns específicos (escolha 5-10)
-- Descomente as linhas abaixo para usar esta opção ao invés da OPÇÃO 1

/*
UPDATE evaluators
SET role = 'mentor'
WHERE email IN (
  'natalia.santos@startcup-amf.com',
  'bruno.costa@startcup-amf.com',
  'mariana.almeida@startcup-amf.com',
  'felipe.rocha@startcup-amf.com',
  'laura.silva@startcup-amf.com',
  'ricardo.moura@startcup-amf.com',
  'camila.fernandes@startcup-amf.com',
  'thiago.martins@startcup-amf.com'
);
*/

-- Verificar resultado
SELECT 
  email,
  name,
  role,
  specialty,
  is_online
FROM evaluators
WHERE role = 'mentor'
ORDER BY name;

-- Contar mentores
SELECT COUNT(*) as total_mentores
FROM evaluators
WHERE role = 'mentor';
