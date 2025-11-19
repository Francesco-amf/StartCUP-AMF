-- ==================================================
-- AUTO-ADVANCE PHASE SYSTEM
-- ==================================================
-- Este script cria uma função que avança automaticamente
-- para a próxima fase quando todas as quests da fase atual
-- tiverem seus prazos totalmente expirados (incluindo janela de atraso).
--
-- COMO USAR:
-- 1. Execute este script completo no Supabase Dashboard > SQL Editor
-- 2. A função será executada automaticamente a cada 60 segundos
-- 3. Quando todas as quests de uma fase expirarem, event_config.current_phase avança
--
-- ==================================================

-- PASSO 1: Criar função que verifica e avança fase
CREATE OR REPLACE FUNCTION auto_advance_phase()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_phase INT;
  v_all_expired BOOLEAN;
  v_total_quests INT;
  v_expired_quests INT;
  v_submitted_quests INT;
  v_next_phase INT;
BEGIN
  -- Buscar fase atual do evento
  SELECT current_phase INTO v_current_phase
  FROM event_config
  LIMIT 1;

  IF v_current_phase IS NULL THEN
    RAISE NOTICE 'Nenhuma fase configurada no event_config';
    RETURN;
  END IF;

  RAISE NOTICE 'Verificando Fase %', v_current_phase;

  -- Contar total de quests da fase atual (usando JOIN com phases)
  SELECT COUNT(*) INTO v_total_quests
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase;

  IF v_total_quests = 0 THEN
    RAISE NOTICE 'Fase % não possui quests', v_current_phase;
    RETURN;
  END IF;

  RAISE NOTICE 'Total de quests na Fase %: %', v_current_phase, v_total_quests;

  -- Contar quests totalmente expiradas (prazo regular + janela de atraso)
  SELECT COUNT(*) INTO v_expired_quests
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.started_at IS NOT NULL
    AND q.planned_deadline_minutes IS NOT NULL
    AND NOW() > (
      q.started_at + 
      (q.planned_deadline_minutes * INTERVAL '1 minute') + 
      (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')
    );

  RAISE NOTICE 'Quests expiradas: %/%', v_expired_quests, v_total_quests;

  -- Contar quests com submissões (considerar como "concluídas")
  SELECT COUNT(DISTINCT q.id) INTO v_submitted_quests
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND EXISTS (
      SELECT 1 FROM submissions s WHERE s.quest_id = q.id
    );

  RAISE NOTICE 'Quests com submissões: %', v_submitted_quests;

  -- Verificar se TODAS as quests expiraram OU foram submetidas
  -- Uma fase está completa se: (quests_expiradas + quests_submetidas) >= total_quests
  v_all_expired := (v_expired_quests >= v_total_quests) OR 
                   ((v_expired_quests + v_submitted_quests) >= v_total_quests);

  IF v_all_expired THEN
    RAISE NOTICE '✅ Condição atendida: Fase % pode avançar', v_current_phase;
    
    -- Calcular próxima fase
    v_next_phase := v_current_phase + 1;

    -- Verificar se próxima fase existe
    IF EXISTS (SELECT 1 FROM phases WHERE order_index = v_next_phase) THEN
      RAISE NOTICE 'Próxima fase (%) encontrada. Avançando...', v_next_phase;
      
      -- Avançar para próxima fase, mas apenas se a próxima fase for maior que a atual
      UPDATE event_config
      SET current_phase = v_next_phase,
          updated_at = NOW()
      WHERE current_phase = v_current_phase AND v_next_phase > v_current_phase;

      -- Ativar a primeira quest da nova fase, se não estiver ativa
      UPDATE quests
      SET started_at = NOW()
      WHERE phase_id = (SELECT id FROM phases WHERE order_index = v_next_phase)
        AND order_index = 1
        AND started_at IS NULL;

      RAISE NOTICE '🎉 Fase % → Fase % (AVANÇADO COM SUCESSO)', v_current_phase, v_next_phase;
    ELSE
      RAISE NOTICE '🏁 Fase % completa, mas não há próxima fase. Evento finalizado.', v_current_phase;
    END IF;
  ELSE
    RAISE NOTICE '⏳ Fase % ainda ativa: %/% expiradas, %/% submetidas. Aguardando.', 
                 v_current_phase, v_expired_quests, v_total_quests, v_submitted_quests, v_total_quests;
  END IF;
END;
$$;

-- ==================================================
-- PASSO 2: Criar extensão pg_cron (se não existir)
-- ==================================================
-- IMPORTANTE: Habilite pg_cron no Supabase Dashboard
-- Dashboard > Database > Extensions > pg_cron > Enable
-- Quando perguntar schema: escolha "public"
--
-- OU execute via SQL:

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA public;

-- ==================================================
-- PASSO 3: Agendar execução automática a cada minuto
-- ==================================================
-- Executa auto_advance_phase() a cada 60 segundos
-- Descomente as linhas abaixo para ativar:

SELECT cron.schedule(
  'auto-advance-phase-job',        -- nome do job
  '* * * * *',                      -- cron expression (a cada minuto)
  $$ SELECT auto_advance_phase(); $$
);

-- ==================================================
-- PASSO 4 (OPCIONAL): Executar agora para teste
-- ==================================================
-- Execute esta linha para testar imediatamente:

SELECT auto_advance_phase();

-- ==================================================
-- VERIFICAÇÃO: Checar se funcionou
-- ==================================================
-- Depois de executar, verifique:

SELECT 
  current_phase,
  (SELECT order_index FROM phases WHERE id = (SELECT id FROM phases WHERE order_index = current_phase LIMIT 1)) as fase_ativa,
  updated_at
FROM event_config;

-- Ver quests expiradas da fase atual:
SELECT 
  q.name,
  q.order_index,
  q.started_at,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  (q.started_at + 
    (q.planned_deadline_minutes * INTERVAL '1 minute') + 
    (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')
  ) as expira_em,
  NOW() > (q.started_at + 
    (q.planned_deadline_minutes * INTERVAL '1 minute') + 
    (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')
  ) as expirou
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = (SELECT current_phase FROM event_config LIMIT 1)
ORDER BY q.order_index;

-- ==================================================
-- DESINSTALAR (se necessário):
-- ==================================================
-- Para remover o agendamento:
-- SELECT cron.unschedule('auto-advance-phase-job');
--
-- Para remover a função:
-- DROP FUNCTION IF EXISTS auto_advance_phase();
