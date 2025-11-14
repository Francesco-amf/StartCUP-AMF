-- Verificar tipo de dado da coluna started_at
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quests'
  AND column_name = 'started_at';

-- Verificar o valor atual de started_at para Quest 5.3
SELECT
  q.id,
  q.name,
  q.status,
  q.started_at,
  pg_typeof(q.started_at) as tipo_atual
FROM quests q
WHERE q.id = 'f8315362-888e-4187-9c6e-bf5ce152a79e';

-- Tentar UPDATE com formato correto (sem timezone)
UPDATE quests
SET started_at = '2025-11-11T15:00:00'::timestamp without time zone
WHERE id = 'f8315362-888e-4187-9c6e-bf5ce152a79e'
RETURNING id, name, started_at, pg_typeof(started_at);
