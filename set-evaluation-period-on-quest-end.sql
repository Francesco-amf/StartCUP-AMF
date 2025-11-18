-- ============================================================
-- TRIGGER: Setar evaluation_period_end_time quando Quest 5.3 termina
-- ============================================================
-- Quando a última quest (5.3) termina (ended_at é setado),
-- o período de avaliação começa automaticamente por 20 minutos
-- ============================================================

CREATE OR REPLACE FUNCTION set_evaluation_period_on_last_quest_end()
RETURNS TRIGGER AS $$
DECLARE
  v_phase_order INT;
  v_total_phases INT;
  v_is_last_quest BOOLEAN;
  v_evaluation_period_minutes INT := 20; -- Período padrão de avaliação
  v_new_evaluation_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verificar se a quest foi encerrada (ended_at mudou de NULL para NOT NULL)
  IF NEW.ended_at IS NOT NULL AND (OLD.ended_at IS NULL OR OLD.ended_at IS DISTINCT FROM NEW.ended_at) THEN

    -- Buscar order_index da fase desta quest
    SELECT p.order_index INTO v_phase_order
    FROM phases p
    WHERE p.id = NEW.phase_id;

    -- Buscar total de fases no evento
    SELECT MAX(order_index) INTO v_total_phases
    FROM phases;

    -- Verificar se esta quest é a última da última fase (Quest 5.3)
    v_is_last_quest := (v_phase_order = v_total_phases) AND (NEW.order_index = 3);

    IF v_is_last_quest THEN
      -- Calcular novo evaluation_period_end_time
      -- = ended_at da última quest + v_evaluation_period_minutes
      v_new_evaluation_end_time := NEW.ended_at + (v_evaluation_period_minutes * INTERVAL '1 minute');

      -- Atualizar event_config com o novo período de avaliação
      UPDATE event_config
      SET evaluation_period_end_time = v_new_evaluation_end_time;

      RAISE NOTICE '✅ Evaluation period setado quando Quest 5.3 terminou: %', v_new_evaluation_end_time;
      RAISE NOTICE '   Quest terminou em: %', NEW.ended_at;
      RAISE NOTICE '   Período de avaliação: % minutos', v_evaluation_period_minutes;
      RAISE NOTICE '   Fim da avaliação em: %', v_new_evaluation_end_time;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger (remove se já existir)
DROP TRIGGER IF EXISTS set_evaluation_period_on_last_quest_end_trigger ON quests;

CREATE TRIGGER set_evaluation_period_on_last_quest_end_trigger
AFTER UPDATE ON quests
FOR EACH ROW
WHEN (NEW.ended_at IS NOT NULL)
EXECUTE FUNCTION set_evaluation_period_on_last_quest_end();

-- ============================================================
-- TESTE
-- ============================================================
/*
-- Ver evento_config atual
SELECT
  event_end_time,
  evaluation_period_end_time,
  all_submissions_evaluated
FROM event_config;

-- Se Quest 5.3 terminou, os valores acima devem estar setados corretamente
*/

-- ============================================================
-- ROLLBACK (se necessário)
-- ============================================================
/*
DROP TRIGGER IF EXISTS set_evaluation_period_on_last_quest_end_trigger ON quests;
DROP FUNCTION IF EXISTS set_evaluation_period_on_last_quest_end();
*/
