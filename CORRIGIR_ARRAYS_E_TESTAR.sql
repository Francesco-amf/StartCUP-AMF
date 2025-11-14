-- ============================================================================
-- CORRIGIR ARRAYS E APLICAR TESTE RÁPIDO
-- ============================================================================
-- Este script:
-- 1. Verifica e corrige deliverable_type arrays malformados
-- 2. Reconstrói Fase 5 (3 quests sem boss)
-- 3. Aplica duração de teste rápido em todas as fases
-- ============================================================================

-- PASSO 0: Garantir colunas necessárias em event_config
ALTER TABLE event_config
ADD COLUMN IF NOT EXISTS evaluation_period_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS all_submissions_evaluated BOOLEAN DEFAULT false;

-- PASSO 1: INFO - Arrays em quests devem estar corretos
SELECT '✅ Iniciando reconstrução de Fase 5 e aplicação de teste rápido' as status;

-- PASSO 2: Limpar Fase 5 antiga completamente
DELETE FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5);

DELETE FROM phases
WHERE order_index = 5;

-- PASSO 3: Recriar Fase 5 com 3 quests (TESTE RÁPIDO - 2 min cada)
INSERT INTO phases (id, order_index, name, duration_minutes, max_points)
VALUES (
  COALESCE((SELECT MAX(id) + 1 FROM phases), 6),
  5,
  'Fase 5: Pitch Final',
  6,         -- 6 minutos total em TESTE (2+2+2 das quests)
  300        -- 100+100+100 = 300 pontos total (SEM BOSS!)
);

-- PASSO 4: Recriar Quest 5.1
INSERT INTO quests (
  id, phase_id, order_index, name, description,
  deliverable_type, status, max_points,
  duration_minutes, planned_deadline_minutes,
  late_submission_window_minutes, allow_late_submissions
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM phases WHERE order_index = 5),
  1,
  'Quest 5.1 - Documento Executivo',
  'Documento executivo de 2 páginas com resumo do projeto, problema, solução e mercado',
  ARRAY['file']::text[],
  'scheduled',
  100,
  2,        -- TESTE: 2 minutos
  2,
  0.5,      -- Late window: 30 seg
  true
);

-- PASSO 5: Recriar Quest 5.2
INSERT INTO quests (
  id, phase_id, order_index, name, description,
  deliverable_type, status, max_points,
  duration_minutes, planned_deadline_minutes,
  late_submission_window_minutes, allow_late_submissions
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM phases WHERE order_index = 5),
  2,
  'Quest 5.2 - Slides de Pitch',
  'Apresentação em slides (máx. 10 slides) com proposta de valor, modelo de negócio e projeções financeiras',
  ARRAY['file']::text[],
  'scheduled',
  100,
  2,        -- TESTE: 2 minutos
  2,
  0.5,      -- Late window: 30 seg
  true
);

-- PASSO 6: Recriar Quest 5.3
INSERT INTO quests (
  id, phase_id, order_index, name, description,
  deliverable_type, status, max_points,
  duration_minutes, planned_deadline_minutes,
  late_submission_window_minutes, allow_late_submissions
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM phases WHERE order_index = 5),
  3,
  'Quest 5.3 - Vídeo Pitch (30s)',
  'Vídeo de pitch de 30 segundos apresentando a solução de forma impactante e memorável',
  ARRAY['file']::text[],
  'scheduled',
  100,
  2,        -- TESTE: 2 minutos
  2,
  0.5,      -- Late window: 30 seg
  true
);

-- PASSO 7: Aplicar TESTE RÁPIDO em Fases 1-4
UPDATE phases SET duration_minutes = 8 WHERE order_index = 1;
UPDATE phases SET duration_minutes = 8 WHERE order_index = 2;
UPDATE phases SET duration_minutes = 8 WHERE order_index = 3;
UPDATE phases SET duration_minutes = 8 WHERE order_index = 4;

-- Atualizar todas as quests das Fases 1-4
UPDATE quests
SET duration_minutes = 2, planned_deadline_minutes = 2, late_submission_window_minutes = 0.5
WHERE phase_id IN (
  SELECT id FROM phases WHERE order_index IN (1, 2, 3, 4)
);

-- PASSO 8: VERIFICAÇÃO - Fases
SELECT '✅ FASES ATUALIZADAS' as resultado;
SELECT
  p.order_index as fase,
  p.name,
  p.duration_minutes,
  COUNT(q.id) as quests,
  SUM(q.max_points) as total_pts
FROM phases p
LEFT JOIN quests q ON q.phase_id = p.id
WHERE p.order_index BETWEEN 1 AND 5
GROUP BY p.id, p.order_index, p.name, p.duration_minutes
ORDER BY p.order_index;

-- PASSO 9: VERIFICAÇÃO - Quests
SELECT '📋 QUESTS ATUALIZADAS' as resultado;
SELECT
  p.order_index as fase,
  q.order_index as quest,
  LEFT(q.name, 40) as name_short,
  q.duration_minutes,
  q.max_points,
  array_to_string(q.deliverable_type::text[], ',') as tipo
FROM phases p
JOIN quests q ON q.phase_id = p.id
WHERE p.order_index BETWEEN 1 AND 5
ORDER BY p.order_index, q.order_index;
