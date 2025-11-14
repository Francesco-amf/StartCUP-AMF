-- Ver o código do trigger que está bloqueando
SELECT
  trigger_schema,
  trigger_name,
  event_object_schema,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'adjust_event_end_time_trigger';

-- Ver a função do trigger
SELECT
  routine_schema,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name LIKE 'adjust%event%' OR routine_name LIKE '%quest%';
