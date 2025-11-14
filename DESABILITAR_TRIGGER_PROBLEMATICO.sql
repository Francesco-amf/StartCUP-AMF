-- ============================================================================
-- DESABILITAR o trigger que está bloqueando UPDATEs na Quest 5.3
-- ============================================================================

-- PASSO 1: Ver triggers ativos
SELECT 'PASSO 1: Triggers Atuais' as "===";
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'quests';

-- PASSO 2: Desabilitar o trigger problemático
SELECT 'PASSO 2: Desabilitando trigger' as "===";
ALTER TABLE quests DISABLE TRIGGER adjust_event_end_time_trigger;

SELECT 'Trigger desabilitado!' as result;

-- PASSO 3: Testar UPDATE na Quest 5.3
SELECT 'PASSO 3: Teste UPDATE após desabilitar trigger' as "===";
UPDATE quests
SET status = 'active', started_at = '2025-11-11T16:09:03.282Z'::timestamp with time zone
WHERE id = 'f8315362-888e-4187-9c6e-bf5ce152a79e'
RETURNING id, name, status, started_at;

-- PASSO 4: Verificar se funcionou
SELECT 'PASSO 4: Verificação' as "===";
SELECT
  id,
  name,
  status,
  started_at
FROM quests
WHERE id = 'f8315362-888e-4187-9c6e-bf5ce152a79e';
