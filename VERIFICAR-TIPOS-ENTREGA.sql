-- ==========================================
-- VERIFICAR TIPOS DE ENTREGA POR QUEST
-- ==========================================

-- PASSO 1: Ver todos os tipos de entrega disponíveis
SELECT
  id,
  name,
  phase_id,
  order_index,
  deliverable_type,
  max_points,
  allow_late_submissions
FROM quests
ORDER BY phase_id, order_index;

-- PASSO 2: Analisar os tipos de deliverable (pode ser array ou string)
-- Se for array, verá como: ["link", "file"] ou {"link", "file"}
-- Se for string, verá como: "link" ou "file" ou "presentation"

-- PASSO 3: Contar quantos tipos diferentes existem
SELECT
  deliverable_type,
  COUNT(*) as total_quests,
  STRING_AGG(name, ', ') as quest_names
FROM quests
GROUP BY deliverable_type
ORDER BY total_quests DESC;

-- PASSO 4: Ver submissões existentes para entender o formato dos dados
SELECT
  s.id,
  s.quest_id,
  q.name as quest_name,
  q.deliverable_type as expected_type,
  s.content,
  s.file_url,
  LENGTH(s.content) as content_size,
  (s.file_url IS NOT NULL) as has_file_url
FROM submissions s
LEFT JOIN quests q ON s.quest_id = q.id
LIMIT 20;
