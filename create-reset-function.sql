-- ==========================================
-- CRIAR FUNÇÃO RPC PARA RESET
-- ==========================================
-- Esta função executa com privilégios de SECURITY DEFINER
-- o que significa que ignora RLS e executa como dono do banco

-- 1. Deletar função se já existir
DROP FUNCTION IF EXISTS reset_system_data();

-- 2. Criar função de reset
CREATE OR REPLACE FUNCTION reset_system_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANTE: Executa com privilégios do dono, ignora RLS
AS $$
DECLARE
  eval_count INTEGER;
  subm_count INTEGER;
  result json;
BEGIN
  -- Deletar evaluations
  DELETE FROM evaluations;
  GET DIAGNOSTICS eval_count = ROW_COUNT;

  -- Deletar submissions
  DELETE FROM submissions;
  GET DIAGNOSTICS subm_count = ROW_COUNT;

  -- Deletar tabelas novas (se existirem)
  BEGIN
    DELETE FROM penalties;
  EXCEPTION WHEN undefined_table THEN
    -- Tabela não existe, continuar
  END;

  BEGIN
    DELETE FROM achievements;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  BEGIN
    DELETE FROM power_ups;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  BEGIN
    DELETE FROM final_pitch;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  BEGIN
    DELETE FROM boss_battles;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- Resetar event_config (se existir)
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
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- Construir resultado
  result := json_build_object(
    'success', true,
    'evaluations_deleted', eval_count,
    'submissions_deleted', subm_count,
    'message', 'Sistema resetado com sucesso!'
  );

  RETURN result;
END;
$$;

-- 3. Dar permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION reset_system_data() TO authenticated;

-- 4. Testar a função
SELECT reset_system_data();
