-- ============================================================================
-- TESTE RÁPIDO SIMPLES - SEM TOCAR EM ARRAYS
-- ============================================================================
-- Este script apenas:
-- 1. Reconstrói Fase 5 (3 quests sem boss)
-- 2. Altera duração apenas das fases (não toca em deliverable_type)
-- ============================================================================

-- PASSO 0: Garantir colunas necessárias em event_config
ALTER TABLE event_config
ADD COLUMN IF NOT EXISTS evaluation_period_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS all_submissions_evaluated BOOLEAN DEFAULT false;

SELECT '✅ Iniciando reconstrução de Fase 5 e teste rápido' as status;

-- PASSO 1: Limpar Fase 5 antiga completamente
DELETE FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5);

DELETE FROM phases
WHERE order_index = 5;

-- PASSO 2: Recriar Fase 5 com 3 quests (TESTE RÁPIDO - 2 min cada)
INSERT INTO phases (id, order_index, name, duration_minutes, max_points)
VALUES (
  COALESCE((SELECT MAX(id) + 1 FROM phases), 6),
  5,
  'Fase 5: Pitch Final',
  6,         -- 6 minutos total em TESTE (2+2+2 das quests)
  300        -- 100+100+100 = 300 pontos total (SEM BOSS!)
);

-- PASSO 3: Recriar Quest 5.1
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

-- PASSO 4: Recriar Quest 5.2
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

-- PASSO 5: Recriar Quest 5.3
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

-- PASSO 6: Aplicar TESTE RÁPIDO - APENAS NAS DURAÇÕES DAS FASES
-- Não alteramos deliverable_type para evitar problemas com arrays malformados
UPDATE phases SET duration_minutes = 8 WHERE order_index = 1;
UPDATE phases SET duration_minutes = 8 WHERE order_index = 2;
UPDATE phases SET duration_minutes = 8 WHERE order_index = 3;
UPDATE phases SET duration_minutes = 8 WHERE order_index = 4;

-- PASSO 7: Atualizar APENAS duration_minutes das quests de Fases 1-4
-- NÃO tocamos em deliverable_type para evitar erros com arrays malformados
UPDATE quests
SET duration_minutes = 2, planned_deadline_minutes = 2, late_submission_window_minutes = 0.5
WHERE id IN (
  SELECT q.id FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index IN (1, 2, 3, 4)
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
  q.name,
  q.duration_minutes,
  q.max_points,
  q.status
FROM phases p
JOIN quests q ON q.phase_id = p.id
WHERE p.order_index BETWEEN 1 AND 5
ORDER BY p.order_index, q.order_index;

SELECT '🎉 TESTE RÁPIDO CONFIGURADO COM SUCESSO!' as resultado;
