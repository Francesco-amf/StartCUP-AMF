-- ==================================================
-- AUTO-ADVANCE PHASE SYSTEM - VERSÃO CORRIGIDA
-- ==================================================
-- CORREÇÃO: Evita avanço quando quests não iniciaram
-- Só avança se TODAS as quests da fase foram processadas
-- ==================================================

-- PASSO 1: Remover função antiga (se existir)
DROP FUNCTION IF EXISTS auto_advance_phase();

-- PASSO 2: Criar função CORRIGIDA
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
  v_not_started_quests INT;
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

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Verificando Fase %', v_current_phase;

  -- Contar total de quests da fase atual
  SELECT COUNT(*) INTO v_total_quests
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase;

  IF v_total_quests = 0 THEN
    RAISE NOTICE '⚠️ Fase % não possui quests configuradas', v_current_phase;
    RETURN;
  END IF;

  RAISE NOTICE 'Total de quests na Fase %: %', v_current_phase, v_total_quests;

  -- Contar quests NÃO INICIADAS (started_at IS NULL)
  SELECT COUNT(*) INTO v_not_started_quests
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  WHERE p.order_index = v_current_phase
    AND q.started_at IS NULL;

  RAISE NOTICE 'Quests não iniciadas: %', v_not_started_quests;

  -- ✅ CORREÇÃO CRÍTICA: Se há quests não iniciadas, NÃO avançar
  IF v_not_started_quests > 0 THEN
    RAISE NOTICE '⏳ Fase % ainda tem % quest(s) não iniciada(s). Aguardando.', 
                 v_current_phase, v_not_started_quests;
    RETURN;
  END IF;

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

  -- ✅ LÓGICA CORRIGIDA: Só avançar se TODAS foram processadas
  -- "Processadas" = expiradas OU submetidas
  -- Mas APENAS se TODAS iniciaram (v_not_started_quests = 0)
  v_all_expired := (v_expired_quests + v_submitted_quests) >= v_total_quests;

  RAISE NOTICE 'Soma (expiradas + submetidas): % >= % (total)', 
               (v_expired_quests + v_submitted_quests), v_total_quests;

  IF v_all_expired THEN
    RAISE NOTICE '✅ Condição atendida: Fase % pode avançar', v_current_phase;
    
    -- Calcular próxima fase
    v_next_phase := v_current_phase + 1;

    -- Verificar se próxima fase existe
    IF EXISTS (SELECT 1 FROM phases WHERE order_index = v_next_phase) THEN
      RAISE NOTICE '➡️ Próxima fase (%) encontrada. Avançando...', v_next_phase;
      
      -- Avançar para próxima fase e setar timestamp de início
      -- ✅ CORRIGIDO: Setar phase_X_start_time para que Live Dashboard funcione
      EXECUTE format(
        'UPDATE event_config 
         SET current_phase = $1,
             phase_%s_start_time = NOW(),
             updated_at = NOW()
         WHERE current_phase = $2',
        v_next_phase
      ) USING v_next_phase, v_current_phase;

      RAISE NOTICE '🎉 Fase % → Fase % (AVANÇADO COM SUCESSO + phase_%s_start_time setado)', 
                   v_current_phase, v_next_phase, v_next_phase;
      
      -- ✅ NOVO: Iniciar primeira quest da próxima fase
      UPDATE quests
      SET started_at = NOW(),
          status = 'active'
      WHERE id = (
        SELECT q.id
        FROM quests q
        JOIN phases p ON q.phase_id = p.id
        WHERE p.order_index = v_next_phase
          AND q.order_index = 1
        LIMIT 1
      );
      
      RAISE NOTICE '▶️ Quest 1 da Fase % iniciada automaticamente', v_next_phase;
      
    ELSE
      RAISE NOTICE '🏁 Fase % completa, mas não há próxima fase. Evento finalizado.', v_current_phase;
    END IF;
  ELSE
    RAISE NOTICE '⏳ Fase % ainda ativa. Processadas: %/% (exp: %, sub: %). Aguardando.', 
                 v_current_phase, 
                 (v_expired_quests + v_submitted_quests),
                 v_total_quests,
                 v_expired_quests,
                 v_submitted_quests;
  END IF;
  
  RAISE NOTICE '========================================';
END;
$$;

-- ==================================================
-- PASSO 3: Testar a função ANTES de agendar
-- ==================================================
-- Execute manualmente para ver os logs:

SELECT auto_advance_phase();

-- Veja os logs no painel "Messages" do SQL Editor

-- ==================================================
-- PASSO 4: Agendar APENAS se teste passou
-- ==================================================
-- IMPORTANTE: Só descomente após confirmar que funciona corretamente!

-- SELECT cron.schedule(
--   'auto-advance-phase-job',
--   '* * * * *',
--   $$ SELECT auto_advance_phase(); $$
-- );

-- ==================================================
-- VERIFICAÇÃO
-- ==================================================

-- Ver estado atual:
SELECT 
  current_phase as fase_atual,
  event_started,
  updated_at
FROM event_config;

-- Ver quests da fase atual:
SELECT 
  p.order_index as fase,
  q.order_index as quest,
  q.name,
  q.status,
  q.started_at,
  q.planned_deadline_minutes,
  CASE 
    WHEN q.started_at IS NULL THEN 'NÃO INICIADA'
    WHEN NOW() > (q.started_at + (q.planned_deadline_minutes * INTERVAL '1 minute') + (COALESCE(q.late_submission_window_minutes, 0) * INTERVAL '1 minute')) THEN 'EXPIRADA'
    ELSE 'ATIVA'
  END as situacao
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = (SELECT current_phase FROM event_config LIMIT 1)
ORDER BY q.order_index;
