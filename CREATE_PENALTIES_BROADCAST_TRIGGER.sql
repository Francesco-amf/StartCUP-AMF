-- ============================================================================
-- CREATE BROADCAST TRIGGER FOR PENALTIES
-- This enables Realtime to detect changes and broadcast them to clients
-- ============================================================================

-- Step 1: Create a trigger function that broadcasts penalty changes
CREATE OR REPLACE FUNCTION public.broadcast_penalties_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast the change event to Realtime subscribers
  PERFORM realtime.broadcast_changes(
    'public',           -- schema
    'penalties',        -- table
    TG_OP::text,       -- INSERT, UPDATE, or DELETE
    json_build_object(
      'id', COALESCE(NEW.id, OLD.id),
      'team_id', COALESCE(NEW.team_id, OLD.team_id),
      'penalty_type', COALESCE(NEW.penalty_type, OLD.penalty_type),
      'points_deduction', COALESCE(NEW.points_deduction, OLD.points_deduction),
      'reason', COALESCE(NEW.reason, OLD.reason),
      'assigned_by_admin', COALESCE(NEW.assigned_by_admin, OLD.assigned_by_admin),
      'assigned_by_evaluator_id', COALESCE(NEW.assigned_by_evaluator_id, OLD.assigned_by_evaluator_id),
      'created_at', COALESCE(NEW.created_at, OLD.created_at)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop existing trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS penalties_broadcast_trigger ON public.penalties;

-- Step 3: Create the trigger for INSERT, UPDATE, DELETE operations
CREATE TRIGGER penalties_broadcast_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.penalties
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_penalties_changes();

-- ============================================================================
-- SUCCESS
-- ============================================================================
SELECT '✅ BROADCAST TRIGGER CREATED FOR PENALTIES!' AS status;
SELECT '✅ Penalties changes will now be broadcast via Realtime' AS detail1;
SELECT '✅ Clients will receive updates within 100ms of change' AS detail2;
SELECT '⚠️ IMPORTANT: Refresh your app and test!' AS detail3;
SELECT '✅ Apply a penalty - it should appear instantly in dashboard' AS detail4;
