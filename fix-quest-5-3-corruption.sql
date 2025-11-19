-- ============================================================================
-- FIX: Quest 5.3 Corrupted - DELETE and RECREATE
-- ============================================================================
-- Problem: Quest 5.3 (ID: eefb5798-a8b5-4d07-9c8d-8fee933dbcd6) is corrupted
-- Error: "UPDATE requires a WHERE clause" even with valid WHERE condition
-- Solution: Delete and recreate the quest with correct data
-- ============================================================================

-- PASSO 1: Verificar Quest 5.3 atual
SELECT 'PASSO 1: Quest 5.3 Corrompida Atual' as step;
SELECT
  q.id,
  q.phase_id,
  q.order_index,
  q.name,
  q.status,
  q.started_at,
  q.ended_at
FROM quests q
WHERE q.id = 'eefb5798-a8b5-4d07-9c8d-8fee933dbcd6';

-- PASSO 2: DELETAR Quest 5.3 corrompida
SELECT 'PASSO 2: Deletando Quest 5.3 Corrompida' as step;
DELETE FROM quests
WHERE id = 'eefb5798-a8b5-4d07-9c8d-8fee933dbcd6';

-- PASSO 3: Verificar que foi deletado
SELECT 'PASSO 3: Verificando Deleção' as step;
SELECT COUNT(*) as remaining_quests_fase5
FROM quests q
WHERE q.phase_id = 5;

-- PASSO 4: Recriar Quest 5.3 com dados corretos
SELECT 'PASSO 4: Recriando Quest 5.3' as step;

INSERT INTO quests (
  id,
  phase_id,
  order_index,
  name,
  description,
  status,
  deliverable_type,
  max_points,
  duration_minutes,
  planned_deadline_minutes,
  late_submission_window_minutes,
  allow_late_submissions,
  auto_start_enabled,
  auto_start_delay_minutes,
  started_at,
  started_by,
  ended_at
)
VALUES (
  gen_random_uuid(), -- Novo ID
  5, -- Fase 5
  3, -- Quest 3
  'Quest 5.3 - Vídeo Pitch (30s)',
  'Vídeo de pitch de 30 segundos apresentando a solução de forma impactante e memorável',
  'scheduled', -- Começa como scheduled
  '["file","url"]', -- Aceita arquivo ou URL
  100, -- 100 pontos
  30, -- 30 minutos de duração
  30, -- 30 minutos planned deadline
  15, -- 15 minutos late window
  true, -- allow_late_submissions
  false, -- auto_start_enabled
  0, -- auto_start_delay_minutes
  NULL, -- started_at
  NULL, -- started_by
  NULL -- ended_at
)
RETURNING id, name, order_index, status, phase_id;

-- PASSO 5: Verificar todas as quests da Fase 5
SELECT 'PASSO 5: Verificação Final - Todas as Quests Fase 5' as step;
SELECT
  q.id,
  q.order_index,
  q.name,
  q.status,
  q.phase_id,
  q.started_at
FROM quests q
WHERE q.phase_id = 5
ORDER BY q.order_index;

-- PASSO 6: Testar UPDATE na nova Quest 5.3 (SEM EXECUTAR)
SELECT 'PASSO 6: Query de Teste (NÃO EXECUTADA)' as step;
SELECT
  'UPDATE quests SET status = ''active'', started_at = NOW() WHERE id = ' || q.id as test_query
FROM quests q
WHERE q.phase_id = 5
AND q.order_index = 3;

SELECT 'FIX COMPLETO!' as status;
