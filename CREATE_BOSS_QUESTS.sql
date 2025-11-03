-- ========================================
-- CRIAR QUESTS BOSS PARA TODAS AS FASES
-- ========================================
-- Adiciona a 4ª quest de cada fase: o BOSS (apresentação de 10 min)
-- BOSS = Quest especial de apresentação presencial (sem entrega digital)
-- ========================================

-- FASE 1: BOSS - "Para quem você está resolvendo e por quê?"
-- ========================================
INSERT INTO quests (
  phase_id,
  name,
  description,
  deliverable_type,
  status,
  max_points,
  order_index,
  planned_deadline_minutes,
  late_submission_window_minutes,
  allow_late_submissions,
  duration_minutes
)
SELECT
  p.id,
  '🎯 BOSS 1 - Defesa do Problema',
  'Apresentação presencial de 3 minutos: Para quem você está resolvendo e por quê? Convença que o problema é real e vale a pena resolver.',
  ARRAY['presentation']::text[],
  'scheduled',
  100,
  4,
  10,
  0,
  false,
  10
FROM phases p
WHERE p.order_index = 1
ON CONFLICT DO NOTHING;

-- FASE 2: BOSS - "Demo de 2 minutos do protótipo"
-- ========================================
INSERT INTO quests (
  phase_id,
  name,
  description,
  deliverable_type,
  status,
  max_points,
  order_index,
  planned_deadline_minutes,
  late_submission_window_minutes,
  allow_late_submissions,
  duration_minutes
)
SELECT
  p.id,
  '🎯 BOSS 2 - Demo do Protótipo',
  'Apresentação presencial de 2 minutos: Demonstre seu protótipo funcionando. Mostre a solução na prática, não apenas em teoria.',
  ARRAY['presentation']::text[],
  'scheduled',
  100,
  4,
  10,
  0,
  false,
  10
FROM phases p
WHERE p.order_index = 2
ON CONFLICT DO NOTHING;

-- FASE 3: BOSS - "Defender o modelo de negócio em 3 minutos"
-- ========================================
INSERT INTO quests (
  phase_id,
  name,
  description,
  deliverable_type,
  status,
  max_points,
  order_index,
  planned_deadline_minutes,
  late_submission_window_minutes,
  allow_late_submissions,
  duration_minutes
)
SELECT
  p.id,
  '🎯 BOSS 3 - Modelo de Negócio',
  'Apresentação presencial de 3 minutos: Defenda como sua startup vai ganhar dinheiro. Explique a estrutura de receitas e custos de forma convincente.',
  ARRAY['presentation']::text[],
  'scheduled',
  100,
  4,
  10,
  0,
  false,
  10
FROM phases p
WHERE p.order_index = 3
ON CONFLICT DO NOTHING;

-- FASE 4: BOSS - "Simulação de pitch com jurado surpresa"
-- ========================================
INSERT INTO quests (
  phase_id,
  name,
  description,
  deliverable_type,
  status,
  max_points,
  order_index,
  planned_deadline_minutes,
  late_submission_window_minutes,
  allow_late_submissions,
  duration_minutes
)
SELECT
  p.id,
  '🎯 BOSS 4 - Pitch Sob Pressão',
  'Apresentação presencial de 3 minutos para jurado surpresa: Simule um pitch real. Convença um investidor desconhecido em tempo limitado.',
  ARRAY['presentation']::text[],
  'scheduled',
  100,
  4,
  10,
  0,
  false,
  10
FROM phases p
WHERE p.order_index = 4
ON CONFLICT DO NOTHING;

-- FASE 5: BOSS FINAL - "Apresentação oficial para os jurados" (200 pts)
-- ========================================
INSERT INTO quests (
  phase_id,
  name,
  description,
  deliverable_type,
  status,
  max_points,
  order_index,
  planned_deadline_minutes,
  late_submission_window_minutes,
  allow_late_submissions,
  duration_minutes
)
SELECT
  p.id,
  '🔥 BOSS FINAL - Pitch Oficial',
  'Apresentação oficial de 5 minutos para banca de jurados: O pitch definitivo. Mostre tudo que construíram durante a maratona.',
  ARRAY['presentation']::text[],
  'scheduled',
  200,
  4,
  10,
  0,
  false,
  10
FROM phases p
WHERE p.order_index = 5
ON CONFLICT DO NOTHING;

-- ========================================
-- VERIFICAR CRIAÇÃO
-- ========================================
SELECT 
  p.order_index as fase,
  q.order_index as quest_num,
  q.name,
  q.deliverable_type,
  q.max_points,
  q.planned_deadline_minutes
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE q.order_index = 4
ORDER BY p.order_index;

-- ========================================
-- RESUMO
-- ========================================
SELECT 
  '✅ BOSS Quests criadas com sucesso!' as status,
  'Fase 1-4: 100 pontos cada (10 min)' as boss_normais,
  'Fase 5: 200 pontos (BOSS FINAL, 10 min)' as boss_final,
  'deliverable_type = presentation (sem submissão digital)' as tipo;
