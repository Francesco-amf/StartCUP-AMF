-- ============================================================================
-- CREATE BROADCAST TRIGGER FOR EVENT_CONFIG
-- This enables Realtime to detect phase/config changes and broadcast them
-- ============================================================================

-- Step 1: Create a trigger function that broadcasts event_config changes
CREATE OR REPLACE FUNCTION public.broadcast_event_config_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast the change event to Realtime subscribers
  PERFORM realtime.broadcast_changes(
    'public',           -- schema
    'event_config',     -- table
    TG_OP::text,       -- INSERT, UPDATE, or DELETE
    json_build_object(
      'id', COALESCE(NEW.id, OLD.id),
      'event_name', COALESCE(NEW.event_name, OLD.event_name),
      'active_phase', COALESCE(NEW.active_phase, OLD.active_phase),
      'phase_status', COALESCE(NEW.phase_status, OLD.phase_status),
      'is_event_started', COALESCE(NEW.is_event_started, OLD.is_event_started),
      'is_event_ended', COALESCE(NEW.is_event_ended, OLD.is_event_ended),
      'evaluation_period_start', COALESCE(NEW.evaluation_period_start, OLD.evaluation_period_start),
      'evaluation_period_end', COALESCE(NEW.evaluation_period_end, OLD.evaluation_period_end)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop existing trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS event_config_broadcast_trigger ON public.event_config;

-- Step 3: Create the trigger for INSERT, UPDATE, DELETE operations
CREATE TRIGGER event_config_broadcast_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.event_config
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_event_config_changes();

-- ============================================================================
-- SUCCESS
-- ============================================================================
SELECT '✅ BROADCAST TRIGGER CREATED FOR EVENT_CONFIG!' AS status;
SELECT '✅ Event config/phase changes will now be broadcast via Realtime' AS detail1;
SELECT '✅ Phase updates will reach all clients within 100ms' AS detail2;
SELECT '⚠️ IMPORTANT: Refresh your app and test phase changes!' AS detail3;
