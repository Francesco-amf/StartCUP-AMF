-- ============================================================================
-- DIAGNÓSTICO UNIFICADO: Todos os resultados em uma única query
-- ============================================================================
-- Este script mostra TODOS os resultados de uma vez usando UNION ALL

-- PASSO 1 + 2 + 3: Quests da Fase 5 e duplicatas
SELECT 'PASSO 1-3: Quests Fase 5 e Duplicatas' as section, NULL::text as detail
UNION ALL
SELECT '  PASSO 1: Quests Atuais', 'ID | order_index | name | status | duration_minutes'
UNION ALL
SELECT
  '    ' || q.id,
  q.order_index::text || ' | ' || q.name || ' | ' || q.status || ' | ' || q.duration_minutes::text
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
ORDER BY q.order_index

UNION ALL
SELECT '', ''
UNION ALL
SELECT '  PASSO 2: Duplicatas (ORDER_INDEX, COUNT)', 'Se COUNT > 1, há problema!'
UNION ALL
SELECT
  '    order_index: ' || q.order_index::text,
  'count: ' || COUNT(*)::text || ' | IDs: ' || STRING_AGG(q.id::text, ' | ')
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 5
GROUP BY q.order_index

UNION ALL
SELECT '', ''
UNION ALL
SELECT 'PASSO 3: Verificar ID específico do erro', 'ID: 08c66a66-a297-4f83-8483-9c9d1848e372'
UNION ALL
SELECT
  CASE
    WHEN q.id IS NOT NULL THEN '  ✓ EXISTE'
    ELSE '  ✗ NÃO EXISTE'
  END,
  COALESCE('name: ' || q.name || ' | status: ' || q.status || ' | order_index: ' || q.order_index::text, 'Quest não encontrada!')
FROM quests q
WHERE q.id = '08c66a66-a297-4f83-8483-9c9d1848e372'

UNION ALL
SELECT '', ''
UNION ALL
SELECT 'PASSO 4: Teste UPDATE Manual - Quest 5.3', 'Tentando: SET status = active'
UNION ALL
WITH quest_5_3_test AS (
  SELECT id FROM quests
  WHERE order_index = 3
    AND phase_id = (SELECT id FROM phases WHERE order_index = 5)
  LIMIT 1
),
update_result AS (
  UPDATE quests
  SET status = 'active', started_at = NOW()
  WHERE id = (SELECT id FROM quest_5_3_test)
  RETURNING id, name, status, started_at
)
SELECT
  '  Status: ' || COALESCE(status, 'FALHOU'),
  'name: ' || COALESCE(name, 'N/A') || ' | started_at: ' || COALESCE(started_at::text, 'N/A')
FROM update_result

UNION ALL
SELECT '', ''
UNION ALL
SELECT 'PASSO 5: Quest 5.2 (que funciona)', 'Comparação com 5.3'
UNION ALL
SELECT
  '  Quest 5.2:',
  'name: ' || q2.name || ' | status: ' || q2.status || ' | duration: ' || q2.duration_minutes::text || 'min'
FROM quests q2
JOIN phases p ON q2.phase_id = p.id
WHERE p.order_index = 5 AND q2.order_index = 2

UNION ALL
SELECT
  '  Quest 5.3:',
  'name: ' || q3.name || ' | status: ' || q3.status || ' | duration: ' || q3.duration_minutes::text || 'min'
FROM quests q3
JOIN phases p ON q3.phase_id = p.id
WHERE p.order_index = 5 AND q3.order_index = 3
LIMIT 1

UNION ALL
SELECT '', ''
UNION ALL
SELECT 'PASSO 6: RLS Policies', 'Se houver muitas policies, pode estar bloqueando'
UNION ALL
SELECT
  '  Policy: ' || policyname,
  'permissive: ' || permissive::text || ' | roles: ' || COALESCE(roles::text, 'public')
FROM pg_policies
WHERE tablename = 'quests'
ORDER BY policyname

UNION ALL
SELECT '', ''
UNION ALL
SELECT 'PASSO 7: Schema da Tabela Quests', 'column_name | data_type | is_nullable'
UNION ALL
SELECT
  '  ' || column_name,
  data_type || ' | nullable: ' || is_nullable::text
FROM information_schema.columns
WHERE table_name = 'quests'
ORDER BY ordinal_position;
