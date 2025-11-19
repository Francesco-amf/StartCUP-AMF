-- =================================================================
-- AUTO-ADVANCE SYSTEM (TRIGGER-BASED) - v2.0
-- =================================================================
-- Replaces the cron-based function with a more reactive trigger-based system.
-- This function is called automatically ONLY when a quest is completed.
-- INCLUDES the requested 20-minute evaluation period after Phase 5.
-- =================================================================

-- Drop the old cron-based function and any existing trigger
DROP FUNCTION IF EXISTS auto_advance_phase();
DROP TRIGGER IF EXISTS on_quest_completion_trigger ON public.quests;
DROP FUNCTION IF EXISTS manage_phase_transition();

-- Create the new trigger-based function
CREATE OR REPLACE FUNCTION manage_phase_transition()
RETURNS TRIGGER AS $$
DECLARE
    v_current_phase_id UUID;
    v_current_phase_sequence INT;
    v_is_final_quest_of_phase BOOLEAN;
    v_event_config RECORD;
BEGIN
    -- Get info from the quest that was just updated
    SELECT phase_id INTO v_current_phase_id FROM public.quests WHERE id = NEW.id;
    SELECT sequence INTO v_current_phase_sequence FROM public.phases WHERE id = v_current_phase_id;

    -- Check if the event is active
    SELECT * INTO v_event_config FROM public.event_config WHERE id = 1 LIMIT 1;
    IF NOT v_event_config.event_started OR v_event_config.event_ended THEN
        RAISE NOTICE '[Transition] Ignored: Event not active.';
        RETURN NEW;
    END IF;

    -- Check if all quests in the current phase are now completed
    SELECT bool_and(status = 'completed') INTO v_is_final_quest_of_phase
    FROM public.quests
    WHERE phase_id = v_current_phase_id;

    -- Only proceed if the entire phase is complete
    IF NOT v_is_final_quest_of_phase THEN
        RAISE NOTICE '[Transition] Phase % not yet complete. Waiting for other quests.', v_current_phase_sequence;
        RETURN NEW;
    END IF;

    RAISE NOTICE '[Transition] Phase % is complete. Processing transition...', v_current_phase_sequence;
    
    -- Mark current phase as 'completed'
    UPDATE public.phases SET status = 'completed' WHERE id = v_current_phase_id;

    -- ==================================================
    -- MAIN TRANSITION LOGIC
    -- ==================================================
    IF v_current_phase_sequence = 5 THEN
        -- PHASE 5 END: Start the 20-minute evaluation period
        RAISE NOTICE '[Transition] Final quest of Phase 5 completed. Starting 20-min evaluation period.';
        
        UPDATE public.phases
        SET duration = interval '20 minutes',
            status = 'evaluation_period'
        WHERE id = v_current_phase_id;

        -- Schedule the event to truly end after 20 minutes using pg_cron
        PERFORM pg_cron.schedule(
            'end-event-after-evaluation',
            '20 minutes',
            $$ UPDATE public.event_config SET event_ended = true WHERE id = 1 $$
        );
        RAISE NOTICE '[Transition] Cron job scheduled to end event in 20 minutes.';

    ELSE
        -- OTHER PHASES END: Advance to the next phase immediately
        DECLARE
            next_phase_id UUID;
            next_phase_sequence INT;
            first_quest_of_next_phase_id UUID;
        BEGIN
            SELECT id, sequence INTO next_phase_id, next_phase_sequence
            FROM public.phases
            WHERE sequence > v_current_phase_sequence
            ORDER BY sequence
            LIMIT 1;

            IF next_phase_id IS NOT NULL THEN
                RAISE NOTICE '[Transition] Advancing from phase % to %.', v_current_phase_sequence, next_phase_sequence;
                UPDATE public.phases SET status = 'active', started_at = now() WHERE id = next_phase_id;

                -- Automatically start the first quest of the new phase
                SELECT id INTO first_quest_of_next_phase_id
                FROM public.quests
                WHERE phase_id = next_phase_id
                ORDER BY sequence
                LIMIT 1;

                IF first_quest_of_next_phase_id IS NOT NULL THEN
                    RAISE NOTICE '[Transition] Activating first quest of new phase: %', first_quest_of_next_phase_id;
                    UPDATE public.quests SET status = 'active', started_at = now() WHERE id = first_quest_of_next_phase_id;
                ELSE
                    RAISE NOTICE '[Transition] Warning: Next phase % has no quests to start.', next_phase_sequence;
                END IF;
            ELSE
                RAISE NOTICE '[Transition] Final phase completed, but it was not phase 5. No next phase found.';
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to call the function AFTER a quest is marked as 'completed'
CREATE OR REPLACE TRIGGER on_quest_completion_trigger
AFTER UPDATE ON public.quests
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
EXECUTE FUNCTION manage_phase_transition();

RAISE NOTICE 'SUCCESS: Trigger-based auto-advance system has been created.';
RAISE NOTICE 'The old auto_advance_phase() function is now removed.';
RAISE NOTICE 'The system will now advance automatically when a quest status changes to completed.';
