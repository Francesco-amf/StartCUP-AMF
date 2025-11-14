-- ============================================================================
-- RECONSTRUIR FASE 5 COMPLETA - DO ZERO COM ESTRUTURA CORRETA
-- ============================================================================
-- IMPORTANTE: Fase 5 NÃO TEM BOSS!
-- - Fase 5 tem EXATAMENTE 3 quests (não 4)
-- - Todas são entregas digitais: 100 pts cada
-- - Total: 300 pontos (não 500)
-- - Ao completar Quest 5.3, dispara evaluation_period
-- ============================================================================

-- PASSO 0: Garantir que event_config tem as colunas necessárias
ALTER TABLE event_config
ADD COLUMN IF NOT EXISTS evaluation_period_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS all_submissions_evaluated BOOLEAN DEFAULT false;

-- PASSO 1: Limpar Fase 5 antiga completamente
DELETE FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5);

DELETE FROM phases
WHERE order_index = 5;

-- PASSO 2: Recriar Fase 5 com parâmetros corretos
INSERT INTO phases (id, order_index, name, duration_minutes, max_points)
VALUES (
  COALESCE((SELECT MAX(id) + 1 FROM phases), 6),
  5,
  'Fase 5: Pitch Final',
  6,         -- 6 minutos total em TESTE (2+2+2 das quests)
  300        -- 100+100+100 = 300 pontos total (SEM BOSS!)
);

-- PASSO 3: Recriar Quest 5.1 - Entrega Digital (100 pts)
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
  ARRAY['file']::text[],  -- Explicitamente array
  'scheduled',
  100,      -- 100 pontos
  2,        -- Duração: 2 minutos (TESTE)
  2,        -- Prazo planejado: 2 minutos (TESTE)
  1,        -- Janela de submissão tardia: 1 minuto (TESTE)
  true      -- Permite submissão tardia
);

-- PASSO 4: Recriar Quest 5.2 - Entrega Digital (100 pts)
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
  ARRAY['file']::text[],  -- Explicitamente array
  'scheduled',
  100,      -- 100 pontos
  2,        -- Duração: 2 minutos (TESTE)
  2,        -- Prazo planejado: 2 minutos (TESTE)
  1,        -- Janela de submissão tardia: 1 minuto (TESTE)
  true      -- Permite submissão tardia
);

-- PASSO 5: Recriar Quest 5.3 - Entrega Digital (100 pts) - ÚLTIMA QUEST
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
  ARRAY['file']::text[],  -- Explicitamente array
  'scheduled',
  100,      -- 100 pontos
  2,        -- Duração: 2 minutos (TESTE)
  2,        -- Prazo planejado: 2 minutos (TESTE)
  1,        -- Janela de submissão tardia: 1 minuto (TESTE)
  true      -- Permite submissão tardia
);

-- PASSO 6: Verificar resultado final
SELECT '✅ FASE 5 RECRIADA - VERIFICAÇÃO' as resultado;

SELECT
  p.id as phase_id,
  p.order_index,
  p.name as phase_name,
  p.duration_minutes,
  p.max_points,
  COUNT(q.id) as total_quests,
  SUM(q.max_points) as total_quest_points
FROM phases p
LEFT JOIN quests q ON q.phase_id = p.id
WHERE p.order_index = 5
GROUP BY p.id, p.order_index, p.name, p.duration_minutes, p.max_points;

-- PASSO 7: Detalhe de cada quest
SELECT '📋 DETALHES DE CADA QUEST' as resultado;

SELECT
  q.order_index,
  q.name,
  q.max_points,
  array_to_string(q.deliverable_type::text[], ', ') as deliverable_type,
  q.status
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
ORDER BY q.order_index;
