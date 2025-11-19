-- ============================================================================
-- DIAGNÓSTICO: Verificar Mentores no Sistema
-- ============================================================================

-- 1. Ver TODOS os avaliadores e seus roles
SELECT 
  id,
  email,
  name,
  role,
  specialty,
  is_online,
  created_at
FROM evaluators
ORDER BY created_at DESC;

-- 2. Contar avaliadores por role
SELECT 
  role,
  COUNT(*) as quantidade,
  COUNT(CASE WHEN is_online = true THEN 1 END) as online,
  COUNT(CASE WHEN is_online = false OR is_online IS NULL THEN 1 END) as offline
FROM evaluators
GROUP BY role;

-- 3. Ver especificamente mentores
SELECT 
  id,
  email,
  name,
  specialty,
  is_online
FROM evaluators
WHERE role = 'mentor'
ORDER BY name;

-- 4. Ver campo role e valores únicos
SELECT DISTINCT role 
FROM evaluators;

-- 5. Verificar se campo role existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'evaluators' 
  AND column_name = 'role';
