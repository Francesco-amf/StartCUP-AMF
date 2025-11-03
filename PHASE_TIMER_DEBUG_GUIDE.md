# 🔧 Phase Timer Showing 00:00:00 - Root Cause & Fix

**Issue**: Dashboard shows "TEMPO TOTAL DA FASE: 00:00:00" and "0% da fase restante" after reset and reactivation
**Status**: ⚠️ INVESTIGATING - Guide for diagnosis and potential fix
**Root Cause**: `phase_1_start_time` in event_config is likely NULL

---

## The Problem Chain

### 1️⃣ Current Flow (BROKEN)

```
Reset Phase 0 → event_config.phase_1_start_time = NULL ✅
                 ↓
Reactivate Phase 1 → start-phase-with-quests called
                     ↓
                     Should set phase_1_start_time = getUTCTimestamp()
                     (line 58 in start-phase-with-quests/route.ts)
                     ↓
useRealtimePhase hook fetches event_config
                     ↓
                     Gets phase_1_start_time value
                     ↓
CurrentQuestTimer receives phaseStartedAt prop
                     ↓
If phaseStartedAt is NULL:
  - calculateTimeLeft() gets startTime = NaN
  - elapsed = now - NaN = NaN
  - totalDuration - NaN = NaN
  - Result: 00:00:00 and 0%
```

---

## What SHOULD Happen

1. Reset is called → `phase_1_start_time = NULL`
2. Reactivate Phase 1 → `phase_1_start_time = getUTCTimestamp()` (e.g., "2025-11-02T14:30:45.123Z")
3. useRealtimePhase fetches event_config
4. Finds `phase_1_start_time = "2025-11-02T14:30:45.123Z"`
5. Passes to CurrentQuestTimer as `phaseStartedAt = "2025-11-02T14:30:45.123Z"`
6. Timer calculates remaining time correctly

---

## 🔍 Diagnostic Steps

### Step 1: Check event_config After Reactivation

Run this in Supabase SQL Editor AFTER reactivating Phase 1:

```sql
SELECT
  current_phase,
  event_started,
  phase_1_start_time,
  phase_2_start_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Expected Result**:
- `current_phase = 1`
- `event_started = true`
- `phase_1_start_time = [TIMESTAMP like 2025-11-02T14:30:45.123Z]`

**If phase_1_start_time is NULL**:
- The endpoint didn't set it correctly
- OR the update didn't persist
- OR there's a race condition

---

### Step 2: Check Browser Console

Open DevTools (F12) → Console tab, then reactivate Phase 1.

Look for logs like:
```
📍 Phase 1:
   phase_1_start_time (raw): 2025-11-02T14:30:45.123Z
   Browser timezone: UTC-3
   Parsed local: 02/11/2025 11:30:45
   phase_duration: 150 min
```

**If you see `phase_1_start_time (raw): null`**:
- event_config has NULL value
- Need to verify endpoint set it correctly

---

### Step 3: Check API Response

When clicking "Reativar Fase 1", check Network tab:
- Look for POST to `/api/admin/start-phase-with-quests`
- Response should include `timestamp: "[ISO timestamp]"`
- If response shows success but timestamp is missing, endpoint has issue

---

## 🔧 Potential Fixes

### Fix Option 1: Verify start-phase-with-quests is Being Called

**Current**: Line 58 in `src/app/api/admin/start-phase-with-quests/route.ts`
```typescript
updateData[`phase_${phase}_start_time`] = getUTCTimestamp()
```

This SHOULD work. But verify:

1. Is the endpoint even being called?
2. Does the supabaseAdmin client have correct permissions?
3. Is there an error that's being silently caught?

**Check**: Add logging after the update to verify it succeeded:
```typescript
if (!configError) {
  console.log('✅ Phase start time updated:', updateData[`phase_${phase}_start_time`])
} else {
  console.error('❌ Failed to update phase start time:', configError)
}
```

---

### Fix Option 2: Dashboard Cache Issue

**Possibility**: The `useRealtimePhase` hook is caching old data

**Solution**: Force a hard refresh or reduce cache:
- Change `refreshInterval` in useRealtimePhase from 5000ms to 2000ms
- Or add a manual trigger to refetch when phase changes

**File**: `src/app/live-dashboard/page.tsx`

```typescript
// Current (line 10):
const phase = useRealtimePhase()

// Could change to:
const phase = useRealtimePhase(2000) // Refresh every 2 seconds instead of 5
```

---

### Fix Option 3: Handle NULL phaseStartedAt in Component

**Possibility**: The component isn't handling NULL gracefully

**File**: `src/components/dashboard/CurrentQuestTimer.tsx` (line 288)

**Current**:
```typescript
const calculateTimeLeft = () => {
  const ensureZFormat = phaseStartedAt.endsWith('Z')  // Crashes if phaseStartedAt is null
    ? phaseStartedAt
    : `${phaseStartedAt}Z`
  // ...
}
```

**Improved**:
```typescript
const calculateTimeLeft = () => {
  // Safety check
  if (!phaseStartedAt) {
    console.warn('⚠️ phaseStartedAt is null/undefined')
    setTimeLeft({
      hours: 0,
      minutes: 0,
      seconds: 0,
      percentage: 0
    })
    return
  }

  const ensureZFormat = phaseStartedAt.endsWith('Z')
    ? phaseStartedAt
    : `${phaseStartedAt}Z`
  // ... rest of calculation
}
```

---

## 📋 Action Plan

### Immediate (Diagnosis)

1. Run `CHECK_EVENT_CONFIG.sql` to see if `phase_1_start_time` is NULL after reactivation
2. Check browser console for phase start time logs
3. Check Network tab to verify API call succeeded

### If phase_1_start_time is NULL

**Option A** (if it's a one-time issue):
```sql
UPDATE event_config
SET phase_1_start_time = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';
```
Then hard refresh browser.

**Option B** (if it's a code issue):
1. Check endpoint logs for errors
2. Add additional logging to start-phase-with-quests
3. Verify supabaseAdmin permissions

### If phase_1_start_time is SET but still showing 00:00:00

Then the issue is in CurrentQuestTimer component calculation:
1. Add safety check for NULL phaseStartedAt
2. Add logging to see NaN values
3. Check if dates are being parsed correctly

---

## 📊 Testing Checklist

- [ ] Run CHECK_EVENT_CONFIG.sql after reactivation
- [ ] Check browser console for phase start time
- [ ] Check Network tab for API response
- [ ] If NULL, manually set with SQL and test
- [ ] If SET but not displaying, add component safety checks
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Verify timer shows correct time

---

## 🎯 Expected Result After Fix

```
✅ FASE 1: DESCOBERTA

⏱️ TEMPO TOTAL DA FASE
2:30:15

[progress bar showing ~99% remaining if just started]

100% da fase restante
```

---

**Status**: Ready for diagnosis
**Time Required**: 10-15 minutes for diagnosis + testing
**Complexity**: Medium (involves checking multiple components + potential API fix)
