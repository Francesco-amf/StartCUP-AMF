-- ============================================================================
-- SOLUÇÃO DEFINITIVA: CREATE TRIGGER para auto-preencher started_at
-- ============================================================================
-- Este trigger preenche automaticamente started_at quando status muda para 'active'
-- Isso resolve o bug "UPDATE requires WHERE clause" ao atualizar started_at manualmente
-- ============================================================================

-- Drop trigger e função se existirem
DROP TRIGGER IF EXISTS auto_set_quest_started_at ON quests;
DROP FUNCTION IF EXISTS set_quest_started_at_on_activate();

-- Criar função que preenche started_at automaticamente
CREATE OR REPLACE FUNCTION set_quest_started_at_on_activate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se status mudou para 'active' E started_at ainda está NULL
  IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.started_at IS NULL THEN
    NEW.started_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger BEFORE UPDATE
CREATE TRIGGER auto_set_quest_started_at
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION set_quest_started_at_on_activate();

-- Test: Tentar ativar Quest 5.3 SEM especificar started_at
SELECT 'Testando trigger auto_set_quest_started_at' as step;

-- Resetar quest para teste
UPDATE quests
SET status = 'scheduled', started_at = NULL
WHERE phase_id = 5 AND order_index = 3;

-- Ativar SEM especificar started_at (trigger deve preencher automaticamente)
UPDATE quests
SET status = 'active'
WHERE phase_id = 5 AND order_index = 3
RETURNING id, name, status, started_at;

-- Verificar se started_at foi preenchido automaticamente
SELECT
  id,
  name,
  status,
  started_at,
  CASE
    WHEN started_at IS NOT NULL THEN '✅ Trigger funcionou!'
    ELSE '❌ Trigger não funcionou'
  END as trigger_status
FROM quests
WHERE phase_id = 5 AND order_index = 3;

-- Resetar para scheduled
UPDATE quests
SET status = 'scheduled', started_at = NULL
WHERE phase_id = 5 AND order_index = 3;

SELECT 'Trigger criado com sucesso!' as status;
