-- ==========================================
-- 🔥 RESET COMPLETO DO SISTEMA - VERSÃO MELHORADA
-- ==========================================
-- Esta função reseta TUDO necessário para um novo evento
-- ==========================================

DROP FUNCTION IF EXISTS reset_system_data();

CREATE OR REPLACE FUNCTION reset_system_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do dono, ignora RLS
AS $$
DECLARE
  eval_count INTEGER := 0;
  subm_count INTEGER := 0;
  penalty_count INTEGER := 0;
  powerup_count INTEGER := 0;
  quest_reset_count INTEGER := 0;
  result json;
BEGIN
  RAISE NOTICE '🔥 ========================================';
  RAISE NOTICE '🔥 INICIANDO RESET COMPLETO DO SISTEMA';
  RAISE NOTICE '🔥 ========================================';

  -- ========================================
  -- 1. DELETAR PENALIDADES
  -- ========================================
  BEGIN
    DELETE FROM penalties;
    GET DIAGNOSTICS penalty_count = ROW_COUNT;
    RAISE NOTICE '✅ Penalties deletadas: %', penalty_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⚠️ Tabela penalties não existe';
  END;

  -- ========================================
  -- 2. DELETAR EVALUATIONS
  -- ========================================
  DELETE FROM evaluations;
  GET DIAGNOSTICS eval_count = ROW_COUNT;
  RAISE NOTICE '✅ Evaluations deletadas: %', eval_count;

  -- ========================================
  -- 3. DELETAR SUBMISSIONS
  -- ========================================
  DELETE FROM submissions;
  GET DIAGNOSTICS subm_count = ROW_COUNT;
  RAISE NOTICE '✅ Submissions deletadas: %', subm_count;

  -- ========================================
  -- 4. DELETAR POWER-UPS
  -- ========================================
  BEGIN
    DELETE FROM power_ups;
    GET DIAGNOSTICS powerup_count = ROW_COUNT;
    RAISE NOTICE '✅ Power-ups deletados: %', powerup_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⚠️ Tabela power_ups não existe';
  END;

  -- ========================================
  -- 5. DELETAR ACHIEVEMENTS (se existir)
  -- ========================================
  BEGIN
    DELETE FROM achievements;
    RAISE NOTICE '✅ Achievements deletados';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⚠️ Tabela achievements não existe';
  END;

  -- ========================================
  -- 6. DELETAR FINAL_PITCH (se existir)
  -- ========================================
  BEGIN
    DELETE FROM final_pitch;
    RAISE NOTICE '✅ Final pitch deletado';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⚠️ Tabela final_pitch não existe';
  END;

  -- ========================================
  -- 7. DELETAR BOSS_BATTLES (se existir)
  -- ========================================
  BEGIN
    DELETE FROM boss_battles;
    RAISE NOTICE '✅ Boss battles deletadas';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⚠️ Tabela boss_battles não existe';
  END;

  -- ========================================
  -- 8. ✨ NOVO: RESETAR QUESTS
  -- ========================================
  -- Limpar started_at e resetar status de todas as quests
  UPDATE quests
  SET started_at = NULL,
      status = 'scheduled'
  WHERE started_at IS NOT NULL;
  GET DIAGNOSTICS quest_reset_count = ROW_COUNT;
  RAISE NOTICE '✅ Quests resetadas: %', quest_reset_count;

  -- ========================================
  -- 9. RESETAR EVENT_CONFIG
  -- ========================================
  BEGIN
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
    RAISE NOTICE '✅ Event config resetado para Fase 0';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⚠️ Tabela event_config não existe';
  END;

  -- ========================================
  -- 10. OPCIONAL: LIMPAR LOGOS DAS EQUIPES
  -- ========================================
  -- Descomente se quiser limpar os logos também:
  -- UPDATE teams SET logo_url = NULL WHERE logo_url IS NOT NULL;
  -- RAISE NOTICE '✅ Logos das equipes removidos';

  RAISE NOTICE '🔥 ========================================';
  RAISE NOTICE '🔥 RESET COMPLETO FINALIZADO';
  RAISE NOTICE '🔥 ========================================';

  -- Construir resultado JSON
  result := json_build_object(
    'success', true,
    'evaluations_deleted', eval_count,
    'submissions_deleted', subm_count,
    'penalties_deleted', penalty_count,
    'power_ups_deleted', powerup_count,
    'quests_reset', quest_reset_count,
    'event_reset', true,
    'message', format('Sistema resetado! %s evaluations, %s submissions, %s penalties, %s power-ups removidos. %s quests resetadas. Evento voltou para Fase 0.',
                      eval_count, subm_count, penalty_count, powerup_count, quest_reset_count)
  );

  RETURN result;
END;
$$;

-- ========================================
-- PERMISSÕES
-- ========================================
GRANT EXECUTE ON FUNCTION reset_system_data() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_system_data() TO service_role;

-- ========================================
-- TESTE
-- ========================================
-- Execute para testar:
SELECT reset_system_data();

-- ========================================
-- VERIFICAR RESULTADO
-- ========================================
-- Após reset, verificar se tudo está limpo:

-- Contagem de registros (deve ser 0)
SELECT 
  (SELECT COUNT(*) FROM submissions) as submissions,
  (SELECT COUNT(*) FROM evaluations) as evaluations,
  (SELECT COUNT(*) FROM penalties) as penalties,
  (SELECT COUNT(*) FROM power_ups) as power_ups;

-- Event config (deve estar em fase 0)
SELECT 
  current_phase,
  event_started,
  event_ended,
  phase_1_start_time,
  phase_2_start_time
FROM event_config;

-- Quests (todas devem estar sem started_at)
SELECT 
  COUNT(*) as total_quests,
  COUNT(*) FILTER (WHERE started_at IS NOT NULL) as quests_com_started_at,
  COUNT(*) FILTER (WHERE status = 'scheduled') as quests_scheduled
FROM quests;
