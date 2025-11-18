# Realtime Live Dashboard Investigation

## Problem Summary

The live dashboard is not updating in real-time when penalties are applied. Instead of showing updates immediately (< 1 second), users must wait 5-10 seconds (polling interval) or manually refresh.

**Root Cause:** Realtime WebSocket subscriptions are failing (status: `CLOSED` or `CHANNEL_ERROR`) and falling back to polling.

## Investigation Results

### What I Found

1. **Realtime Subscriptions Configured:** ✅
   - `useRealtimePenalties()` - properly set up with Realtime subscription + polling fallback
   - `useRealtimeRanking()` - properly set up with Realtime subscription + polling fallback
   - `useRealtimePhase()` - uses polling only (no Realtime, intentional for phase data)

2. **Fallback System Working:** ✅
   - When Realtime fails (CLOSED/CHANNEL_ERROR), polls every 10 seconds
   - Penalty enrichment with team names and evaluator names working
   - Sound playback triggered on new penalty detection

3. **RLS Policies Applied:** ✅
   - Policies exist for read/insert/update/delete on penalties table
   - But may be **too restrictive** for Realtime to broadcast updates

4. **Problem Identified:** ❌
   - Realtime WebSocket connections not establishing properly
   - Subscriptions report `CLOSED` or `CHANNEL_ERROR` status
   - This indicates one of:
     - RLS policies blocking Realtime notifications
     - Tables not published to Realtime in Supabase project settings
     - Service role lacking proper permissions
     - Realtime not enabled for specific tables

## Diagnostics Available

### 1. Check Current Status
**File:** `DIAGNOSTICO_REALTIME_COMPLETO.sql`

Run this in Supabase SQL Editor to check:
- ✅ RLS enabled on penalties/live_ranking/event_config
- ✅ All RLS policies listed
- ✅ Permissions for service_role
- ✅ Triggers on penalties table
- ✅ Realtime publications
- ✅ Data count verification

**Action:** Run in Supabase Dashboard > SQL Editor > Copy/paste entire file > Execute

### 2. Fix RLS Policies
**File:** `FIX_REALTIME_RLS.sql`

This script:
- Drops restrictive RLS policies
- Creates new OPEN read policies that allow Realtime to broadcast
- Grants service_role full SELECT permissions
- Adds clear comments about Realtime publication requirements

**Action:** Run this AFTER diagnostic to fix RLS issues

### 3. Browser Console Logging
Enhanced logging added to help diagnose:

```javascript
// You'll see logs like:
📡 [useRealtimeRanking] Subscription status: SUBSCRIBED   // Good! Realtime working
📡 [useRealtimeRanking] Subscription status: CLOSED        // Problem - fallback to polling
⚠️ [useRealtimeRanking] Realtime inativo (CLOSED), ativando fallback...
🔄 [useRealtimeRanking] Ativando polling fallback para penalidades...
```

## Next Steps (For User)

### Step 1: Run Diagnostic SQL
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy all content from `DIAGNOSTICO_REALTIME_COMPLETO.sql`
4. Execute
5. Review results - look for:
   - RLS enabled? (should be `t` for true)
   - Policies listed? (should see ~5-6 policies)
   - Triggers listed? (might be empty - that's ok)
   - Publications include penalties/event_config? (check table names)

### Step 2: Apply RLS Fix
1. If diagnostic shows restrictive policies or RLS issues:
2. Copy all content from `FIX_REALTIME_RLS.sql`
3. Execute in SQL Editor
4. Verify completion message

### Step 3: Check Realtime Publications
Go to Supabase Dashboard > Database > Publications > supabase_realtime

**Must have these tables published:**
- `penalties` - for penalty updates
- `event_config` - for phase updates
- `live_ranking` - for ranking updates

If NOT listed, add them:
1. Click "Edit" on supabase_realtime publication
2. Find and check: penalties, event_config, live_ranking
3. Save changes

### Step 4: Test in Browser
1. Open live dashboard
2. Open Browser Developer Tools > Console tab
3. Look for these messages:
   - ✅ "Subscription status: SUBSCRIBED" - Realtime working!
   - ❌ "Subscription status: CLOSED" or "CHANNEL_ERROR" - Realtime failing

4. If Realtime still not working after fixes:
   - Check Supabase project status (is Realtime add-on enabled?)
   - Check network tab for WebSocket connections
   - Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct

## Technical Details

### Why Realtime Might Fail

1. **RLS Policies:** Realtime needs SELECT access to tables to broadcast changes
   - If policy is too restrictive, Realtime can't send updates
   - Fix: Allow `authenticated` and `anon` roles to SELECT

2. **Table Publication:** Supabase must have tables published to Realtime
   - Database > Publications > supabase_realtime must include target tables
   - If table not published, Realtime never sees changes

3. **Service Role:** Realtime service needs database access
   - GRANT SELECT ON table TO service_role

4. **WebSocket Connection:** Browser must maintain WebSocket connection
   - Check Network tab in DevTools for wss:// connections
   - If failing, browser may have network issues or proxy blocking WebSockets

### Polling Fallback Strategy

Current polling intervals:
- **Penalties:** Every 10 seconds (activation delay: 5 seconds)
- **Ranking:** Every 10 seconds (activation delay: 5 seconds)
- **Phase:** Every 2 seconds (always polling, no Realtime)

This means max delay for seeing updates:
- **Best case (Realtime working):** < 100ms
- **Worst case (polling only):** 10 seconds + initial request time

## Code Changes Made

1. **Enhanced Logging:** Added console.log + DEBUG logging to subscription status callbacks
   - Files modified: `src/lib/hooks/useRealtime.ts`
   - Now shows actual status values for debugging

2. **Diagnostic Scripts Created:**
   - `DIAGNOSTICO_REALTIME_COMPLETO.sql` - Check system status
   - `FIX_REALTIME_RLS.sql` - Fix RLS issues for Realtime

## Commit History

- `1ccc4b3` - Add enhanced Realtime diagnostics and RLS fixes

## Success Criteria

Realtime is working when you see:
- ✅ Console logs: "Subscription status: SUBSCRIBED"
- ✅ Penalties appear in dashboard within 1-2 seconds of admin applying them
- ✅ No "Ativando polling fallback" messages
- ✅ Network tab shows active WebSocket connection (wss://)

## Questions?

If Realtime still not working after following these steps:
1. Verify database RLS policies (run DIAGNOSTICO_REALTIME_COMPLETO.sql)
2. Check Supabase project has Realtime add-on enabled
3. Verify tables are published to supabase_realtime publication
4. Check browser console for any WebSocket connection errors
5. Look at Network tab in DevTools for wss:// errors
