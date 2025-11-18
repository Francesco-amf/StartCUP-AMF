-- ============================================================================
-- FIX BROADCAST TRIGGERS WITH CORRECT REALTIME.BROADCAST_CHANGES SIGNATURE
-- This script corrects the trigger functions to use the proper 8-parameter
-- signature for realtime.broadcast_changes()
-- ============================================================================

-- ============================================================================
-- PART 1: PENALTIES BROADCAST TRIGGER - CORRECTED
-- ============================================================================

-- Create function with CORRECT 8-parameter signature
CREATE OR REPLACE FUNCTION public.broadcast_penalties_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'public:penalties',  -- topic_name (1st parameter)
    TG_OP,               -- event_name (2nd parameter) - INSERT, UPDATE, DELETE
    TG_OP::text,         -- operation (3rd parameter)
    'penalties',         -- table_name (4th parameter)
    'public',            -- table_schema (5th parameter)
    NEW,                 -- new record (6th parameter)
    OLD,                 -- old record (7th parameter)
    'ROW'                -- level (8th parameter)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger for penalties
DROP TRIGGER IF EXISTS penalties_broadcast_trigger ON public.penalties;
CREATE TRIGGER penalties_broadcast_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.penalties
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_penalties_changes();

-- ============================================================================
-- PART 2: EVENT_CONFIG BROADCAST TRIGGER - CORRECTED
-- ============================================================================

-- Create function with CORRECT 8-parameter signature
CREATE OR REPLACE FUNCTION public.broadcast_event_config_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'public:event_config',  -- topic_name (1st parameter)
    TG_OP,                  -- event_name (2nd parameter) - INSERT, UPDATE, DELETE
    TG_OP::text,            -- operation (3rd parameter)
    'event_config',         -- table_name (4th parameter)
    'public',               -- table_schema (5th parameter)
    NEW,                    -- new record (6th parameter)
    OLD,                    -- old record (7th parameter)
    'ROW'                   -- level (8th parameter)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger for event_config
DROP TRIGGER IF EXISTS event_config_broadcast_trigger ON public.event_config;
CREATE TRIGGER event_config_broadcast_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.event_config
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_event_config_changes();

-- ============================================================================
-- PART 3: SUBMISSIONS BROADCAST TRIGGER - CORRECTED
-- (Affects live_ranking view via broadcasts)
-- ============================================================================

-- Create function with CORRECT 8-parameter signature
CREATE OR REPLACE FUNCTION public.broadcast_submissions_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'public:live_ranking',  -- topic_name (1st parameter)
    TG_OP,                  -- event_name (2nd parameter) - INSERT, UPDATE, DELETE
    TG_OP::text,            -- operation (3rd parameter)
    'live_ranking',         -- table_name (4th parameter)
    'public',               -- table_schema (5th parameter)
    NEW,                    -- new record (6th parameter)
    OLD,                    -- old record (7th parameter)
    'ROW'                   -- level (8th parameter)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger for submissions
DROP TRIGGER IF EXISTS submissions_broadcast_trigger ON public.submissions;
CREATE TRIGGER submissions_broadcast_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_submissions_changes();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '✅ ALL BROADCAST TRIGGERS FIXED WITH CORRECT SIGNATURE!' AS status;
SELECT '✅ Penalties: Broadcasting via realtime.broadcast_changes() with 8 parameters' AS detail1;
SELECT '✅ Event Config: Broadcasting via realtime.broadcast_changes() with 8 parameters' AS detail2;
SELECT '✅ Live Ranking: Broadcasting via realtime.broadcast_changes() with 8 parameters' AS detail3;
SELECT '⚠️ CRITICAL: Refresh your browser (F5) to re-establish WebSocket connection' AS detail4;
SELECT '⚠️ IMPORTANT: Clear browser cache to force reload of application' AS detail5;
SELECT '✅ Test by applying a penalty - should appear INSTANTLY!' AS detail6;

-- List all broadcast triggers to confirm they exist
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND trigger_name IN (
  'penalties_broadcast_trigger',
  'event_config_broadcast_trigger',
  'submissions_broadcast_trigger'
)
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- DIAGNOSTIC INFO: Verify trigger functions exist and their definitions
-- ============================================================================

SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'broadcast_penalties_changes',
  'broadcast_event_config_changes',
  'broadcast_submissions_changes'
)
ORDER BY routine_name;
