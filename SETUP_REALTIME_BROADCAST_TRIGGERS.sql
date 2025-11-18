-- ============================================================================
-- SETUP REALTIME BROADCAST TRIGGERS
-- Enables instant Realtime updates for penalties and event_config
-- ============================================================================
-- IMPORTANT: Run this script in Supabase SQL Editor
-- This creates the database triggers that send changes via Realtime
-- ============================================================================

-- ============================================================================
-- PART 1: BROADCAST TRIGGER FOR PENALTIES
-- ============================================================================

-- Create function to broadcast penalty changes
CREATE OR REPLACE FUNCTION public.broadcast_penalties_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'public:penalties',  -- topic_name
    TG_OP,               -- event_name (INSERT, UPDATE, DELETE)
    TG_OP::text,         -- operation
    'penalties',         -- table_name
    'public',            -- table_schema
    NEW,                 -- new record
    OLD,                 -- old record
    'ROW'                -- level
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
-- PART 2: BROADCAST TRIGGER FOR EVENT_CONFIG
-- ============================================================================

-- Create function to broadcast event_config changes
CREATE OR REPLACE FUNCTION public.broadcast_event_config_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'public:event_config',  -- topic_name
    TG_OP,                  -- event_name (INSERT, UPDATE, DELETE)
    TG_OP::text,            -- operation
    'event_config',         -- table_name
    'public',               -- table_schema
    NEW,                    -- new record
    OLD,                    -- old record
    'ROW'                   -- level
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
-- PART 3: BROADCAST TRIGGER FOR SUBMISSIONS (affects live_ranking)
-- Note: live_ranking is a VIEW based on submissions + penalties
-- When submissions change, we need to broadcast ranking updates
-- ============================================================================

-- Create function to broadcast ranking changes (when submissions change)
CREATE OR REPLACE FUNCTION public.broadcast_submissions_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'public:live_ranking',  -- topic_name
    TG_OP,                  -- event_name (INSERT, UPDATE, DELETE)
    TG_OP::text,            -- operation
    'live_ranking',         -- table_name
    'public',               -- table_schema
    NEW,                    -- new record
    OLD,                    -- old record
    'ROW'                   -- level
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger for submissions (updates live_ranking)
DROP TRIGGER IF EXISTS submissions_broadcast_trigger ON public.submissions;
CREATE TRIGGER submissions_broadcast_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_submissions_changes();

-- ============================================================================
-- VERIFICATION & SUCCESS
-- ============================================================================

SELECT '✅ REALTIME BROADCAST TRIGGERS CREATED!' AS status;
SELECT '✅ Penalties: Changes broadcast via Realtime' AS detail1;
SELECT '✅ Event Config: Phase changes broadcast via Realtime' AS detail2;
SELECT '✅ Live Ranking: Score updates broadcast via Realtime' AS detail3;
SELECT '⚠️ NEXT STEP: Refresh your app (F5)' AS detail4;
SELECT '✅ Test by applying a penalty - should appear INSTANTLY!' AS detail5;

-- Verify triggers exist
SELECT
  trigger_name,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND trigger_name IN (
  'penalties_broadcast_trigger',
  'event_config_broadcast_trigger',
  'submissions_broadcast_trigger'
)
ORDER BY event_object_table;
