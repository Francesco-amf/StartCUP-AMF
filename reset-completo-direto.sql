-- ==========================================
-- RESET COMPLETO E DIRETO
-- ==========================================
-- Este script usa TRUNCATE para garantir que tudo seja deletado

-- TRUNCATE é mais eficiente e ignora RLS
-- CASCADE remove registros dependentes automaticamente

-- Desabilitar RLS temporariamente para o reset
ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Deletar tudo
TRUNCATE evaluations CASCADE;
TRUNCATE submissions CASCADE;

-- Tentar deletar das novas tabelas (se existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'penalties') THEN
    TRUNCATE penalties CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
    TRUNCATE achievements CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'power_ups') THEN
    TRUNCATE power_ups CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'final_pitch') THEN
    TRUNCATE final_pitch CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'boss_battles') THEN
    TRUNCATE boss_battles CASCADE;
  END IF;
END $$;

-- Resetar event_config (se existir)
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
  END IF;
END $$;

-- Reabilitar RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Verificar resultado
SELECT
  '✅ RESET COMPLETO!' as status,
  (SELECT COUNT(*) FROM evaluations) as avaliacoes,
  (SELECT COUNT(*) FROM submissions) as submissoes,
  (SELECT COUNT(*) FROM teams) as equipes_cadastradas,
  (SELECT current_phase FROM event_config WHERE id = '00000000-0000-0000-0000-000000000001' LIMIT 1) as fase_atual;
