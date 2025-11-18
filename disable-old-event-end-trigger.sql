-- ============================================================
-- DESABILITAR TRIGGER ANTIGO
-- ============================================================
-- O trigger antigo "adjust_event_end_time_trigger" seta event_end_time
-- quando Quest 5.3 INICIA. Isso está ERRADO!
--
-- O novo sistema:
-- 1. Quando Quest 5.3 TERMINA → seta evaluation_period_end_time (20 min)
-- 2. Período de avaliação termina → mostra countdown final
-- 3. Countdown termina → mostra "Evento Terminado"
--
-- Devemos desabilitar o trigger antigo para evitar conflitos
-- ============================================================

-- Desabilitar o trigger antigo
ALTER TABLE quests DISABLE TRIGGER adjust_event_end_time_trigger;

RAISE NOTICE '✅ Trigger adjust_event_end_time_trigger foi DESABILITADO';
RAISE NOTICE '   Este trigger era responsável por setar event_end_time quando Quest 5.3 iniciava';
RAISE NOTICE '   Agora usamos evaluation_period_end_time que é setado quando Quest 5.3 TERMINA';

-- ============================================================
-- VERIFICAR TRIGGERS ATIVOS
-- ============================================================
/*
SELECT
  trigger_name,
  event_object_schema,
  event_object_table,
  enabled
FROM information_schema.triggers
WHERE event_object_table = 'quests'
ORDER BY trigger_name;
*/

-- ============================================================
-- ROLLBACK (se necessário)
-- ============================================================
/*
ALTER TABLE quests ENABLE TRIGGER adjust_event_end_time_trigger;
*/
