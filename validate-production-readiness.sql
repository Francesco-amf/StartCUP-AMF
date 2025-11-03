-- ==========================================
-- VALIDAR PRONTIDÃO PARA PRODUÇÃO (15 equipes)
-- ==========================================

-- 1. Verificar schema de todas as tabelas
SELECT 'TABLE STRUCTURES:' as "=== VALIDAÇÕES ===";

SELECT table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name IN ('teams', 'phases', 'quests', 'submissions', 'evaluations', 'penalties', 'event_config')
GROUP BY table_name
ORDER BY table_name;

-- 2. Verificar constraints e índices
SELECT 'INDEXES AND CONSTRAINTS:' as "===";

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('teams', 'phases', 'quests', 'submissions', 'evaluations', 'penalties', 'event_config')
ORDER BY tablename, indexname;

-- 3. Contar registros atuais
SELECT 'CURRENT DATA:' as "===";

SELECT 'Teams:' as type, COUNT(*) as count FROM teams
UNION ALL
SELECT 'Phases:', COUNT(*) FROM phases
UNION ALL
SELECT 'Quests:', COUNT(*) FROM quests
UNION ALL
SELECT 'Submissions:', COUNT(*) FROM submissions
UNION ALL
SELECT 'Evaluations:', COUNT(*) FROM evaluations
UNION ALL
SELECT 'Penalties:', COUNT(*) FROM penalties
UNION ALL
SELECT 'Evaluators:', COUNT(*) FROM evaluators;

-- 4. Verificar RLS está habilitado
SELECT 'RLS STATUS:' as "===";

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('teams', 'phases', 'quests', 'submissions', 'evaluations', 'penalties', 'event_config')
ORDER BY tablename;

-- 5. Verificar event_config está inicializado
SELECT 'EVENT CONFIG:' as "===";

SELECT
  id,
  current_phase,
  event_started,
  event_ended,
  event_start_time,
  created_at
FROM event_config;

-- 6. Testar live_ranking view
SELECT 'LIVE RANKING (TEST):' as "===";

SELECT team_id, team_name, course, total_points, quests_completed
FROM live_ranking
ORDER BY total_points DESC
LIMIT 5;

-- 7. Verificar fase details
SELECT 'PHASE STRUCTURE:' as "===";

SELECT id, order_index, name, description, duration_minutes
FROM phases
ORDER BY order_index;

-- 8. Verificar quest structure
SELECT 'QUEST STRUCTURE:' as "===";

SELECT
  id,
  order_index,
  name,
  phase_id,
  (SELECT name FROM phases WHERE id = quests.phase_id) as phase_name,
  status,
  max_points,
  duration_minutes
FROM quests
ORDER BY order_index
LIMIT 20;

-- 9. Resultado final
SELECT 'PRODUCTION READINESS VALIDATION COMPLETE!' as "✅ Status";
