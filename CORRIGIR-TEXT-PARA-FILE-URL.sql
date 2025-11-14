-- ==========================================
-- CORRIGIR: TEXT ONLY → FILE OU URL
-- ==========================================

-- PASSO 1: Atualizar todas as quests com APENAS text
-- Para: ["file", "url"] (arquivo ou link)

UPDATE quests
SET deliverable_type = '["file", "url"]'
WHERE deliverable_type = '"text"'
   OR deliverable_type = 'text'
   OR (deliverable_type IS NOT NULL AND LENGTH(deliverable_type) = 4);

-- PASSO 2: Verificar resultado
SELECT
  id,
  name,
  phase_id,
  order_index,
  deliverable_type
FROM quests
ORDER BY phase_id, order_index;

-- PASSO 3: Confirmar mudanças
SELECT
  COUNT(*) as total_quests_corrigidas,
  '["file", "url"]' as novo_deliverable_type
FROM quests
WHERE deliverable_type = '["file", "url"]';
