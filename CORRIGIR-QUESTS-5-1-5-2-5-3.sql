-- ==========================================
-- CORRIGIR QUESTS 5.1, 5.2, 5.3
-- ==========================================
-- Problema: formato errado {file} → correto: ["file","url"]

-- PASSO 1: Ver antes da correção
SELECT
  id,
  name,
  deliverable_type,
  'ANTES' as etapa
FROM quests
WHERE id IN (
  'a7e1f50d-ef6e-4276-a129-ca1f3c786ce2',
  'ada6400b-c1f6-4f48-9518-ac383cb68a6b',
  'eefb5798-a8b5-4d07-9c8d-8fee933dbcd6'
);

-- PASSO 2: CORRIGIR para formato JSON array correto
UPDATE quests
SET deliverable_type = '["file","url"]'
WHERE id IN (
  'a7e1f50d-ef6e-4276-a129-ca1f3c786ce2',  -- Quest 5.1
  'ada6400b-c1f6-4f48-9518-ac383cb68a6b',  -- Quest 5.2
  'eefb5798-a8b5-4d07-9c8d-8fee933dbcd6'   -- Quest 5.3
);

-- PASSO 3: Verificar resultado após correção
SELECT
  id,
  name,
  phase_id,
  order_index,
  deliverable_type,
  'DEPOIS' as etapa
FROM quests
WHERE phase_id = 5
ORDER BY order_index;

-- PASSO 4: Confirmar todas as quests estão corretas agora
SELECT
  'Status Final' as info,
  COUNT(*) as total_quests,
  COUNT(CASE WHEN deliverable_type LIKE '%["url"%' OR deliverable_type LIKE '%["file"%' OR deliverable_type LIKE '%presentation%' THEN 1 END) as corretas,
  COUNT(CASE WHEN deliverable_type NOT LIKE '%["url"%' AND deliverable_type NOT LIKE '%["file"%' AND deliverable_type NOT LIKE '%presentation%' THEN 1 END) as ainda_com_problemas
FROM quests;
