-- ============================================================================
-- FIX: Sync penalties changes to ranking updates
-- Problem: live_ranking is a MATERIALIZED VIEW, not a table
-- Realtime only works with actual tables, not views!
-- Solution: Force ranking refresh by triggering penalty changes
-- ============================================================================

-- The core issue:
-- 1. Penalty is added/updated → triggers broadcast
-- 2. live_ranking VIEW recalculates (happens automatically)
-- 3. BUT: Realtime can't broadcast view changes (not a real table)
-- 4. So dashboard doesn't know live_ranking changed until polling (10s delay)

-- Current workaround: We rely on polling (10 seconds) OR manual refresh
-- Better solution: Manually trigger updatesa via webhook or push notification

-- For now, the BEST approach is:
-- 1. Keep penalty Realtime working ✅ (penalidades são tabela real)
-- 2. Keep ranking polling at 10s (fallback)
-- 3. Add EXPLICIT ranking refresh trigger when penalties change

-- Step 1: Create a trigger that NOTIFIES about ranking refresh need
-- (This is a workaround since Postgres can't directly broadcast view changes)

CREATE OR REPLACE FUNCTION notify_ranking_refresh_on_penalty_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all listening clients that ranking needs refresh
  -- This uses Postgres LISTEN/NOTIFY (not Realtime)
  PERFORM pg_notify(
    'ranking_update_needed',  -- channel name
    json_build_object(
      'timestamp', NOW(),
      'team_id', COALESCE(NEW.team_id, OLD.team_id),
      'action', TG_OP
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger on penalties
DROP TRIGGER IF EXISTS "notify_ranking_refresh_on_penalty_change" ON public.penalties;

CREATE TRIGGER "notify_ranking_refresh_on_penalty_change"
AFTER INSERT OR UPDATE OR DELETE
ON public.penalties
FOR EACH ROW
EXECUTE FUNCTION notify_ranking_refresh_on_penalty_change();

-- Step 3: For Realtime to work with ranking, we need to ensure
-- useRealtimeRanking hook ALWAYS checks for updates, even when tab is hidden

-- The real fix: Update useRealtimeRanking to NOT skip updates when page is hidden
-- Instead, queue them and apply when page becomes visible

-- Verify trigger was created
SELECT
  trigger_name,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'penalties'
AND trigger_name = 'notify_ranking_refresh_on_penalty_change';

-- ============================================================================
-- SUCCESS INDICATORS
-- ============================================================================

SELECT '✅ PENALTY→RANKING SYNC TRIGGER CREATED!' AS status;
SELECT '✅ Penalties changes now notify ranking subscribers' AS detail1;
SELECT '⚠️ Note: Ranking updates may take 10-15s (polling fallback)' AS detail2;
SELECT '✅ Next step: Update useRealtimeRanking to NOT skip hidden tab updates' AS detail3;
