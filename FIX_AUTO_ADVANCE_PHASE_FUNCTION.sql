-- FIX: Corrigir função auto_advance_phase() para usar colunas corretas
-- Problema: função está usando coluna "deadline" que não existe
-- Solução: usar "started_at + planned_deadline_minutes" para calcular deadline

-- EXECUTAR ESTE SQL NO SUPABASE DASHBOARD

CREATE OR REPLACE FUNCTION auto_advance_phase()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_phase INT;
    v_event_started BOOLEAN;
    v_event_ended BOOLEAN;
    v_all_quests_closed BOOLEAN;
    v_phase_start_time TIMESTAMP;
    v_phase_duration INT;
    v_phase_deadline TIMESTAMP;
BEGIN
    -- Buscar configuração atual do evento
    SELECT 
        current_phase,
        event_started,
        event_ended
    INTO 
        v_current_phase,
        v_event_started,
        v_event_ended
    FROM event_config
    WHERE id = '00000000-0000-0000-0000-000000000001';

    -- Se evento não começou ou já terminou, sair
    IF NOT v_event_started OR v_event_ended THEN
        RETURN;
    END IF;

    -- Se ainda está na fase 0 (preparação), sair
    IF v_current_phase = 0 THEN
        RETURN;
    END IF;

    -- Se já está na última fase (5), verificar se deve encerrar evento
    IF v_current_phase >= 5 THEN
        -- Verificar se todas as quests da fase 5 foram fechadas
        SELECT NOT EXISTS (
            SELECT 1 FROM quests 
            WHERE phase_id = 5 
            AND status != 'closed'
        ) INTO v_all_quests_closed;

        IF v_all_quests_closed THEN
            -- Encerrar evento
            UPDATE event_config
            SET 
                event_ended = true,
                event_end_time = NOW()
            WHERE id = '00000000-0000-0000-0000-000000000001';
        END IF;
        RETURN;
    END IF;

    -- ✅ FIX: Verificar se todas as quests da fase atual foram fechadas
    -- Usando a lógica correta: started_at + planned_deadline_minutes
    SELECT NOT EXISTS (
        SELECT 1 
        FROM quests
        WHERE phase_id = v_current_phase
        AND (
            -- Quest ativa que ainda não passou do deadline
            (status = 'active' AND started_at + (planned_deadline_minutes || ' minutes')::INTERVAL > NOW())
            OR
            -- Quest agendada (ainda não começou)
            status = 'scheduled'
        )
    ) INTO v_all_quests_closed;

    -- Se ainda há quests ativas ou agendadas, sair
    IF NOT v_all_quests_closed THEN
        RETURN;
    END IF;

    -- Todas as quests da fase atual foram fechadas, avançar para próxima fase
    v_current_phase := v_current_phase + 1;

    -- Atualizar event_config
    EXECUTE format(
        'UPDATE event_config SET current_phase = %s, phase_%s_start_time = NOW() WHERE id = %L',
        v_current_phase,
        v_current_phase,
        '00000000-0000-0000-0000-000000000001'
    );

    -- Iniciar primeira quest da nova fase
    UPDATE quests
    SET 
        status = 'active',
        started_at = NOW()
    WHERE phase_id = v_current_phase
    AND order_index = 1;

    RAISE NOTICE 'Avançado para Fase %', v_current_phase;
END;
$$;

-- Testar a função
SELECT auto_advance_phase();
