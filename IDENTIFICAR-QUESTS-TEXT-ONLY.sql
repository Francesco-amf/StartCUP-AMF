-- ==========================================
-- IDENTIFICAR QUESTS COM APENAS TEXT
-- ==========================================

-- PASSO 1: Ver todos os tipos de deliverable
SELECT
  id,
  name,
  phase_id,
  order_index,
  deliverable_type,
  CASE
    WHEN deliverable_type = '"text"' OR deliverable_type = 'text' THEN '❌ APENAS TEXT (PROBLEMA!)'
    WHEN deliverable_type LIKE '%"file"%' OR deliverable_type LIKE '%"url"%' THEN '✅ TEM FILE OU URL'
    WHEN deliverable_type LIKE '%presentation%' THEN '🔥 BOSS PRESENTATION'
    ELSE '⚠️ TIPO DESCONHECIDO: ' || deliverable_type
  END as status
FROM quests
ORDER BY phase_id, order_index;

-- PASSO 2: Contar problemas
SELECT
  COUNT(CASE WHEN deliverable_type = '"text"' OR deliverable_type = 'text' THEN 1 END) as quests_text_only,
  COUNT(CASE WHEN deliverable_type NOT IN ('"text"', 'text') THEN 1 END) as quests_com_arquivo_ou_link
FROM quests;

-- PASSO 3: Listar APENAS as quests que têm problema
SELECT
  id,
  name,
  phase_id,
  order_index,
  deliverable_type
FROM quests
WHERE deliverable_type = '"text"'
   OR deliverable_type = 'text'
   OR (deliverable_type IS NOT NULL AND LENGTH(deliverable_type) = 4)
ORDER BY phase_id, order_index;
