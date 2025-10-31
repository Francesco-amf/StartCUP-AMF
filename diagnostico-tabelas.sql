-- ==========================================
-- DIAGNÓSTICO DE TABELAS
-- ==========================================
-- Verifica quais tabelas existem no banco de dados

-- Verificar tabelas existentes
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'event_config',
    'power_ups',
    'achievements',
    'boss_battles',
    'final_pitch',
    'penalties',
    'teams',
    'evaluators',
    'submissions',
    'evaluations'
  )
ORDER BY table_name;

-- Verificar views existentes
SELECT
  table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('live_ranking', 'team_stats')
ORDER BY table_name;

-- Se event_config existe, mostrar conteúdo
SELECT 'Conteúdo de event_config:' as info;
SELECT * FROM event_config LIMIT 1;

-- Contar registros em cada tabela (se existirem)
SELECT 'Contagem de registros:' as info;

SELECT
  'teams' as tabela,
  COUNT(*) as total
FROM teams
UNION ALL
SELECT 'evaluators', COUNT(*) FROM evaluators
UNION ALL
SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL
SELECT 'evaluations', COUNT(*) FROM evaluations;

-- Tentar contar nas tabelas novas (vai dar erro se não existirem)
-- SELECT 'event_config', COUNT(*) FROM event_config
-- UNION ALL SELECT 'boss_battles', COUNT(*) FROM boss_battles
-- UNION ALL SELECT 'achievements', COUNT(*) FROM achievements
-- UNION ALL SELECT 'power_ups', COUNT(*) FROM power_ups
-- UNION ALL SELECT 'penalties', COUNT(*) FROM penalties
-- UNION ALL SELECT 'final_pitch', COUNT(*) FROM final_pitch;
