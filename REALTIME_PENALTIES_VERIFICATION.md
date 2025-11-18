# Realtime Penalties - Verification & Testing Guide

## Status Summary

After investigating and fixing the penalties Realtime issue, we've identified and resolved the root cause:

### What Was Wrong
- The `RankingBoard.tsx` component was using the basic `usePenalties()` hook
- This hook was **recreating the Supabase client on every render** (causing subscription failures)
- The basic hook lacked proper error handling and polling fallback logic

### What Was Fixed
1. **Fixed `usePenalties.ts`**: Added `useRef` to maintain singleton Supabase client
2. **Updated `RankingBoard.tsx`**: Switched to `useRealtimePenalties()` hook (robust implementation with error handling)
3. **Database Configuration**: Confirmed all prerequisite setup was correct:
   - ✅ Realtime enabled in Supabase project
   - ✅ Penalties table published to `supabase_realtime`
   - ✅ Broadcast triggers created with correct 8-parameter signature
   - ✅ RLS policies configured correctly

---

## Verification Steps

### Step 1: Check Realtime Subscription Status

**What to do:**
1. Open your live dashboard in the browser
2. Open DevTools (F12 → Console tab)
3. Filter for "useRealtimePenalties" logs
4. Look for one of these messages:

**Expected Messages:**
```
✅ [useRealtimePenalties] Realtime subscription ativa para penalidades!
```
OR if using polling fallback:
```
🔄 [useRealtimePenalties] Ativando polling fallback para penalidades...
```

**What this means:**
- ✅ **SUBSCRIBED status**: Realtime connection is working. Penalties will update INSTANTLY when applied
- 🔄 **Polling fallback active**: Realtime not working, but polling fallback is active. Penalties will update every 10 seconds

Both scenarios mean the fix is working correctly!

---

### Step 2: Test Penalty Application (Real-World Test)

**What to do:**
1. Keep the live dashboard open in one browser tab
2. Open the admin panel in another browser tab
3. In admin panel: Apply a penalty to any team
4. Watch the live dashboard **without refreshing**

**Expected behavior:**

If **Realtime SUBSCRIBED** (instant updates):
- Penalty appears on dashboard **within 1-2 seconds**
- Console shows: `🎵 [RankingBoard] Houve mudança de ranking...`
- Console shows: `🔴 [RankingBoard] Penalidade detectada para [TeamName]: -[Points]`

If **Polling fallback** (10-second updates):
- Penalty appears on dashboard **within 10-15 seconds**
- Console shows same detection messages as above
- Console shows: `⏳ [useRealtimePenalties-Fallback] Polling fallback...` every 10s

**Success criteria:**
✅ Penalty appears on live dashboard WITHOUT manual page refresh
✅ Penalty amount is correctly deducted from team's points
✅ Ranking may re-sort if team position changes

---

### Step 3: Monitor Penalty Detection

**Look for these console logs** (in order of appearance):

```
🔴 [RankingBoard] Penalidade detectada para [Team Name]: -[Points]
📈 [RankingBoard] Time subiu no ranking: [Team Name] (pos1 → pos2)
🪙 [RankingBoard] Time ganhou [Points] coins: [Team Name]
🎵 [RankingBoard] Houve mudança de ranking, tocando som UMA VEZ
```

---

## Troubleshooting

### Issue: No console logs appear at all
**Fix:** Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R) to clear cache

### Issue: Penalties appear after manual refresh only
**Possible cause:** Realtime subscription failed and polling isn't active
**Fix:** Check if you see this error:
```
❌ [useRealtimePenalties] Realtime setup error:
```
If yes, polling should activate automatically after 5 seconds. If no polling logs appear:
1. Hard refresh browser
2. Check browser network tab for WebSocket errors
3. Verify Supabase project URL is correct in `.env.local`

### Issue: Penalty point deduction is incorrect
**Check:** Verify penalty_type and points_deduction in database
Valid penalty types: 'plagio', 'desorganizacao', 'desrespeito', 'ausencia', 'atraso'

---

## Technical Details for Developers

### Hook Implementation

The fix leverages the proven pattern from `useRealtimeRanking()`:

```typescript
// ✅ CORRECT: Maintain singleton Supabase client
const supabaseRef = useRef(createClient())
const supabase = supabaseRef.current

useEffect(() => {
  // Setup Realtime subscription
  // Dependency array is EMPTY to prevent recreation
}, [])
```

### Component Integration

RankingBoard now uses the robust hook:

```typescript
// ✅ CORRECT: Uses hook with error handling & polling fallback
const { penalties } = useRealtimePenalties()

// Create stable helper function
const getPenalty = useCallback((teamId: string): number => {
  const teamPenalties = penalties.filter(p => p.team_id === teamId)
  return teamPenalties.reduce((total, p) => total + (p.points_deduction || 0), 0)
}, [penalties])
```

### Realtime Flow

1. **Initial load**: Fetch all penalties via REST API
2. **Subscribe**: Listen for INSERT/UPDATE/DELETE on penalties table
3. **On change**:
   - If Realtime SUBSCRIBED: Instant update (0-2 seconds)
   - If Realtime DOWN: Fallback to polling every 10 seconds
4. **Sound effects**: Play 'penalty' sound when new penalty detected (if page visible)

---

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/hooks/usePenalties.ts` | Added useRef for Supabase client + fixed dependency array |
| `src/components/dashboard/RankingBoard.tsx` | Switched to useRealtimePenalties hook + created getPenalty helper |

---

## Next Steps if Issues Persist

1. **Check database logs**: Run diagnostic SQL to verify triggers are firing
   ```bash
   TAIL realtime logs in Supabase dashboard
   ```

2. **Verify admin panel penalty submission**: Ensure penalty is actually being saved to database

3. **Check network requests**: Open DevTools Network tab and apply a penalty, verify:
   - Admin creates penalty (POST request succeeds)
   - Dashboard receives WebSocket message (WS frame) OR polling REST request succeeds

4. **Contact support**: If WebSocket consistently fails, may be network/firewall issue

---

## Success Indicators

When everything is working correctly, you should see:

**Console (Dashboard):**
```
📡 [useRealtimePenalties] Subscription status: SUBSCRIBED
✅ [useRealtimePenalties] Realtime subscription ativa para penalidades!
🔴 [RankingBoard] Penalidade detectada para S.Y.M.: -10
```

**Dashboard UI:**
- Penalty appears on live ranking immediately after admin applies it
- No manual refresh needed
- Points are deducted from team total
- Team may move to different ranking position

---

## Reverting Changes (If Needed)

All changes are minimal and non-breaking:
- `usePenalties.ts`: Can be reverted to original if other components depend on it
- `RankingBoard.tsx`: Can switch back to `usePenalties` if useRealtimePenalties causes issues
- Database: No schema changes - all configuration can be undone

---

**Last Updated**: 2025-11-18
**Status**: ✅ Realtime Penalties Fix Complete - Awaiting User Verification
