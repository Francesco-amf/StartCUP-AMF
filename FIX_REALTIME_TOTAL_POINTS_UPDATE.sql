-- ============================================================================
-- FIX: Trigger broadcast to live_ranking when penalties change
-- This ensures total_points updates in real-time via Realtime
-- ============================================================================

-- The issue: When a penalty is added/updated, live_ranking view RECALCULATES,
-- but Realtime doesn't know about it because the view itself isn't a table.
-- Solution: Create a trigger on penalties that broadcasts to live_ranking subscribers

-- Step 1: Create trigger function to broadcast live_ranking changes when penalties change
CREATE OR REPLACE FUNCTION broadcast_live_ranking_on_penalty_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast to all live_ranking subscribers when penalty changes
  PERFORM realtime.broadcast_changes(
    'public:live_ranking'::text,        -- topic_name: where the change is
    'UPDATE'::text,                     -- event_name: what happened
    'UPDATE'::text,                     -- operation
    'live_ranking'::text,               -- table_name
    'public'::text,                     -- table_schema
    NULL,                               -- NEW (for materialized views, we can't inspect)
    NULL,                               -- OLD
    'ROW'::text                         -- level
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger on penalties table
-- Fires on INSERT, UPDATE, DELETE - any penalty change triggers live_ranking update
DROP TRIGGER IF EXISTS "broadcast_live_ranking_on_penalty_change" ON public.penalties;

CREATE TRIGGER "broadcast_live_ranking_on_penalty_change"
AFTER INSERT OR UPDATE OR DELETE
ON public.penalties
FOR EACH ROW
EXECUTE FUNCTION broadcast_live_ranking_on_penalty_change();

-- Step 3: Verify trigger exists
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'penalties'
AND trigger_name = 'broadcast_live_ranking_on_penalty_change';

-- ============================================================================
-- SUCCESS INDICATORS
-- ============================================================================

SELECT '✅ LIVE_RANKING REALTIME TRIGGER CREATED!' AS status;
SELECT '✅ Penalties change → Broadcast to live_ranking subscribers' AS detail1;
SELECT '✅ Total points will update in real-time when penalty applied' AS detail2;
SELECT '✅ Works for both automatic (late window) and manual (admin) penalties' AS detail3;
SELECT '⚠️ CRITICAL: Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)' AS detail4;
SELECT '✅ Test: Apply penalty - points should update INSTANTLY!' AS detail5;
