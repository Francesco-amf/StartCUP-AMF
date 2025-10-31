-- ==========================================
-- RESET NUCLEAR - ÚLTIMA OPÇÃO
-- ==========================================
-- Este script remove TUDO forçadamente, ignorando RLS e constraints

-- IMPORTANTE: Este é o reset mais agressivo possível
-- Deve ser executado como administrador no Supabase SQL Editor

-- ==========================================
-- PASSO 1: DESABILITAR RLS EM TUDO
-- ==========================================
ALTER TABLE IF EXISTS evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS penalties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS power_ups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS final_pitch DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS boss_battles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_config DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- PASSO 2: TRUNCATE TUDO (ignora foreign keys com CASCADE)
-- ==========================================

-- IMPORTANTE: TRUNCATE ignora RLS e deleta tudo forçadamente
-- Ordem é importante por causa de foreign keys (deletar dependentes primeiro)

-- Deletar tabelas de dados primeiro (ordem importa por causa de FKs)
DO $$
BEGIN
  -- Deletar evaluations (depende de submissions)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evaluations') THEN
    TRUNCATE TABLE evaluations CASCADE;
    RAISE NOTICE '✅ Evaluations truncated';
  END IF;

  -- Deletar submissions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN
    TRUNCATE TABLE submissions CASCADE;
    RAISE NOTICE '✅ Submissions truncated';
  END IF;

  -- Deletar novas tabelas (se existirem)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'penalties') THEN
    TRUNCATE TABLE penalties CASCADE;
    RAISE NOTICE '✅ Penalties truncated';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
    TRUNCATE TABLE achievements CASCADE;
    RAISE NOTICE '✅ Achievements truncated';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'power_ups') THEN
    TRUNCATE TABLE power_ups CASCADE;
    RAISE NOTICE '✅ Power ups truncated';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'final_pitch') THEN
    TRUNCATE TABLE final_pitch CASCADE;
    RAISE NOTICE '✅ Final pitch truncated';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'boss_battles') THEN
    TRUNCATE TABLE boss_battles CASCADE;
    RAISE NOTICE '✅ Boss battles truncated';
  END IF;
END $$;

-- ==========================================
-- PASSO 3: RESETAR EVENT_CONFIG (se existir)
-- ==========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_config') THEN
    UPDATE event_config
    SET
      current_phase = 0,
      event_started = false,
      event_ended = false,
      phase_1_start_time = null,
      phase_2_start_time = null,
      phase_3_start_time = null,
      phase_4_start_time = null,
      phase_5_start_time = null,
      event_start_time = null,
      event_end_time = null,
      updated_at = NOW()
    WHERE id = '00000000-0000-0000-0000-000000000001';
    RAISE NOTICE '✅ Event config reset';
  END IF;
END $$;

-- ==========================================
-- PASSO 4: REABILITAR RLS
-- ==========================================
ALTER TABLE IF EXISTS evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS final_pitch ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS boss_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_config ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PASSO 5: VERIFICAR RESULTADO
-- ==========================================
SELECT
  '✅ RESET NUCLEAR COMPLETO!' as status,
  (SELECT COUNT(*) FROM evaluations) as avaliacoes,
  (SELECT COUNT(*) FROM submissions) as submissoes,
  (SELECT COUNT(*) FROM penalties) as penalidades,
  (SELECT COUNT(*) FROM achievements) as conquistas,
  (SELECT COUNT(*) FROM power_ups) as power_ups,
  (SELECT COUNT(*) FROM boss_battles) as boss_battles,
  (SELECT COUNT(*) FROM final_pitch) as final_pitch,
  (SELECT COUNT(*) FROM teams) as equipes,
  (SELECT current_phase FROM event_config WHERE id = '00000000-0000-0000-0000-000000000001' LIMIT 1) as fase_atual,
  (SELECT event_started FROM event_config WHERE id = '00000000-0000-0000-0000-000000000001' LIMIT 1) as evento_iniciado;
