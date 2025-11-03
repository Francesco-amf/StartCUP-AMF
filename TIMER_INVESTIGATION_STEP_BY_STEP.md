# 🔍 Timer Investigation - Step by Step

**Issue**: Timer still shows 00:00:00 even after reactivating Phase 1
**Logs Show**: timestamp exists but is old (180+ min elapsed vs 150 min duration)
**Root Cause**: Phase 1 start time is NOT being updated when reactivating

---

## 🧪 Test Procedure

### Step 1: Check Current Server Logs

When you reactivate Phase 1, look for these server console messages:

**Expected Messages** (in order):
```
🔵 START-PHASE-WITH-QUESTS ENDPOINT CALLED with phase: 1
✅ Generated phase_1_start_time: 2025-11-02T[NEW_TIME]
✅ Phase 1 started:
   - Intended timestamp: 2025-11-02T[NEW_TIME]
   - Database timestamp: 2025-11-02T[NEW_TIME]
   - Match: ✅ YES
✅ Primeira quest da Fase 1 ativada: [quest name]
✅ Sistema atualizado para: Fase 1: Descoberta
```

**What to Watch For**:
- ✅ If you see "ENDPOINT CALLED" → API is being invoked correctly
- ✅ If you see "Generated phase_1_start_time" → getUTCTimestamp() is working
- ✅ If both timestamps match → Database update succeeded
- ❌ If no messages appear → Endpoint not being called
- ❌ If timestamps don't match → Database update failed

---

### Step 2: Hard Refresh & Test

1. Press `Ctrl+Shift+R` to reload code with new logging
2. Open DevTools (F12) and go to Console tab
3. Click "Reset" button
4. Immediately click "Reativar Fase 1" button
5. **WATCH the server logs carefully**

---

## 🎯 Likely Issues & Fixes

### Issue A: Endpoint Not Being Called

**Signs**:
- No "🔵 START-PHASE-WITH-QUESTS ENDPOINT CALLED" message
- Button click doesn't trigger server logs

**Cause**:
- Button click handler not wired to endpoint
- Network request blocked or cached

**Fix**:
Check `src/components/PhaseController.tsx` to verify button is calling the right endpoint

---

### Issue B: getUTCTimestamp() Not Generating Fresh Time

**Signs**:
- "Generated phase_1_start_time: 2025-11-02T17:00:28.225" appears but doesn't change between clicks
- Same timestamp every time

**Cause**:
- Function returning cached value
- OR timestamp calculated incorrectly

**Fix**:
Verify `src/lib/utils.ts` getUTCTimestamp() function is correct:

```typescript
export function getUTCTimestamp(): string {
  const now = new Date()
  const timezoneOffsetMinutes = now.getTimezoneOffset()
  const utcTime = new Date(now.getTime() - timezoneOffsetMinutes * 60 * 1000)
  return utcTime.toISOString()
}
```

---

### Issue C: Database Update Not Persisting

**Signs**:
- "Generated: 2025-11-02T17:00:28.225"
- "Database: 2025-11-02T17:00:28.225"  ← Same old time!
- "Match: ❌ NO"

**Cause**:
- Supabase permissions issue
- Table column not writable
- Update query not executing

**Fix**:
Run diagnostic SQL to check if column exists and is writable:

```sql
-- Check event_config structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'event_config'
AND column_name LIKE 'phase_%';

-- Try manual update
UPDATE event_config
SET phase_1_start_time = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verify
SELECT phase_1_start_time FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
```

---

### Issue D: Hook Not Refreshing After Update

**Signs**:
- Endpoint logs show successful update
- Database shows new timestamp
- Browser still shows old timestamp

**Cause**:
- useRealtimePhase hook refreshing too slowly
- Hook cached old data

**Fix**:
Change refresh interval in `src/app/live-dashboard/page.tsx`:

```typescript
// Current:
const phase = useRealtimePhase()

// Change to:
const phase = useRealtimePhase(1000)  // 1 second instead of 5
```

---

## 📋 Debug Checklist

When reactivating Phase 1, verify in order:

- [ ] **Server Log**: See "🔵 ENDPOINT CALLED"?
  - No → Button not wired correctly
  - Yes → Continue

- [ ] **Server Log**: See "Generated phase_1_start_time"?
  - No → getUTCTimestamp() not called
  - Yes → Continue

- [ ] **Server Log**: See "Match: ✅ YES"?
  - No → Database update failed
  - Yes → Continue

- [ ] **Browser Console**: See new phase_1_start_time value?
  - No → Hook not refreshed
  - Yes → Timer should update next!

- [ ] **Dashboard**: Timer shows ~2:30:00?
  - Yes → **PROBLEM SOLVED!** ✅
  - No → Continue investigation

---

## 🔧 Manual Fix (Immediate)

If all else fails, manually set the timestamp:

```sql
UPDATE event_config
SET phase_1_start_time = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Wait 5 seconds, then hard refresh browser
```

Dashboard should show timer counting down from 2:30:00.

---

## 📊 What the Logs Tell Us

**Current logs show**:
```
phase_1_start_time (raw): 2025-11-02T17:00:28.225  ← This is the stored value
elapsed: 180.3 minutes
totalDuration: 150.0 minutes
```

This means:
- Phase started at 17:00:28 (stored value)
- It's been 180+ minutes since then
- Phase duration is 150 min
- So phase expired 30+ minutes ago

**This is CORRECT calculation**, but the timestamp is OLD.

The fix: Make sure `phase_1_start_time` is updated to NOW when reactivating.

---

## 🎯 Expected Behavior After Fix

**Before Reactivate**:
```
TEMPO TOTAL DA FASE: 00:00:00
0% da fase restante
```

**After Reactivate (immediately)**:
```
TEMPO TOTAL DA FASE: 2:30:00
100% da fase restante
```

**After 30 minutes**:
```
TEMPO TOTAL DA FASE: 2:00:00
80% da fase restante
```

---

## 📝 Next Actions

1. **Hard refresh**: `Ctrl+Shift+R`
2. **Check server logs**: Watch for endpoint call messages
3. **Test reactivation**: Click reset then reactivate
4. **Share server logs**: Copy/paste the endpoint messages
5. **Check timestamp**: Is it updating each time?

The new logging will show exactly where the problem is!

---

**Status**: 🔧 Ready for testing with enhanced logging
**Time**: 5 minutes to diagnose
**Next**: Run test and share server logs
