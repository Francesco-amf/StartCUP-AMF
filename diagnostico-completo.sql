-- ==========================================
-- DIAGNÓSTICO COMPLETO DO SISTEMA
-- ==========================================
-- Este script verifica TUDO no banco de dados

-- 1. Verificar quais tabelas existem
SELECT
  '=== TABELAS EXISTENTES ===' as info;

SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Contar registros em TODAS as tabelas existentes
SELECT
  '=== CONTAGEM DE REGISTROS ===' as info;

-- Tabelas antigas (devem existir)
SELECT 'teams' as tabela, COUNT(*) as total FROM teams
UNION ALL SELECT 'evaluators', COUNT(*) FROM evaluators
UNION ALL SELECT 'quests', COUNT(*) FROM quests
UNION ALL SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL SELECT 'evaluations', COUNT(*) FROM evaluations;

-- 3. Verificar tabelas novas (se existirem)
DO $$
BEGIN
  RAISE NOTICE '=== VERIFICANDO NOVAS TABELAS ===';

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_config') THEN
    RAISE NOTICE 'event_config: EXISTS';
  ELSE
    RAISE NOTICE 'event_config: NOT EXISTS';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'power_ups') THEN
    RAISE NOTICE 'power_ups: EXISTS';
  ELSE
    RAISE NOTICE 'power_ups: NOT EXISTS';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
    RAISE NOTICE 'achievements: EXISTS';
  ELSE
    RAISE NOTICE 'achievements: NOT EXISTS';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'boss_battles') THEN
    RAISE NOTICE 'boss_battles: EXISTS';
  ELSE
    RAISE NOTICE 'boss_battles: NOT EXISTS';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'final_pitch') THEN
    RAISE NOTICE 'final_pitch: EXISTS';
  ELSE
    RAISE NOTICE 'final_pitch: NOT EXISTS';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'penalties') THEN
    RAISE NOTICE 'penalties: EXISTS';
  ELSE
    RAISE NOTICE 'penalties: NOT EXISTS';
  END IF;
END $$;

-- 4. Mostrar detalhes das submissions que ainda existem
SELECT
  '=== DETALHES DAS SUBMISSIONS ===' as info;

SELECT
  id,
  team_id,
  quest_id,
  status,
  final_points,
  created_at
FROM submissions
LIMIT 10;

-- 5. Mostrar detalhes das evaluations que ainda existem
SELECT
  '=== DETALHES DAS EVALUATIONS ===' as info;

SELECT
  id,
  submission_id,
  evaluator_id,
  points,
  created_at
FROM evaluations
LIMIT 10;

-- 6. Verificar RLS nas tabelas principais
SELECT
  '=== POLÍTICAS RLS ATIVAS ===' as info;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('evaluations', 'submissions', 'teams')
ORDER BY tablename, policyname;

-- 7. Verificar se event_config existe e seu conteúdo
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_config') THEN
    RAISE NOTICE '=== EVENT CONFIG ===';
    PERFORM * FROM event_config;
  END IF;
END $$;

SELECT * FROM event_config WHERE id = '00000000-0000-0000-0000-000000000001';
