-- ============================================================================
-- DIAGNÓSTICO: Por que evaluation_period_end_time não está sendo exibido
-- ============================================================================

-- PASSO 1: Ver estado atual do event_config
SELECT 'PASSO 1: Estado atual de event_config' as "===";
SELECT
  id,
  event_ended,
  event_end_time,
  evaluation_period_end_time,
  all_submissions_evaluated,
  updated_at
FROM event_config
ORDER BY updated_at DESC;

-- PASSO 2: Ver quests da Fase 5 e seu status
SELECT 'PASSO 2: Quests da Fase 5' as "===";
SELECT
  q.id,
  q.order_index,
  q.name,
  q.status,
  q.started_at,
  q.completed_at,
  q.created_at,
  q.updated_at
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
ORDER BY q.order_index;

-- PASSO 3: Ver se há submissões para a Fase 5
SELECT 'PASSO 3: Submissões de quests da Fase 5' as "===";
SELECT
  COUNT(*) as total_submissoes,
  MAX(created_at) as ultima_submissao
FROM submissions s
JOIN quests q ON s.quest_id = q.id
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5;

-- PASSO 4: Ver logs de quando 5.3 foi completado (procurar por updated_at mais recente)
SELECT 'PASSO 4: Quests com mais recentes updates' as "===";
SELECT
  q.id,
  q.order_index,
  q.name,
  q.status,
  q.updated_at,
  p.order_index as phase_order
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY q.updated_at DESC
LIMIT 10;

-- PASSO 5: Comparar timestamps
SELECT 'PASSO 5: Comparação de timestamps importantes' as "===";
SELECT
  'Quest 5.3 última atualização' as descricao,
  (SELECT q.updated_at FROM quests q
   JOIN phases p ON q.phase_id = p.id
   WHERE p.order_index = 5 AND q.order_index = 3
   ORDER BY q.updated_at DESC LIMIT 1) as timestamp
UNION ALL
SELECT
  'event_config última atualização',
  (SELECT updated_at FROM event_config ORDER BY updated_at DESC LIMIT 1)
UNION ALL
SELECT
  'evaluation_period_end_time atual',
  (SELECT evaluation_period_end_time::text FROM event_config LIMIT 1);

-- PASSO 6: Verificar se event_config foi atualizado DEPOIS de 5.3 terminar
SELECT 'PASSO 6: Verificar se evento foi agendado corretamente' as "===";
SELECT
  CASE WHEN event_ended = true THEN '❌ Evento já finalizado'
       WHEN evaluation_period_end_time IS NOT NULL THEN '✅ Período de avaliação agendado'
       ELSE '⚠️ Período de avaliação NÃO está agendado'
  END as status,
  event_ended,
  evaluation_period_end_time,
  event_end_time,
  NOW() as hora_atual,
  CASE WHEN evaluation_period_end_time IS NOT NULL THEN
    (evaluation_period_end_time::timestamp > NOW())
  ELSE FALSE END as "ainda_ativo?"
FROM event_config;
