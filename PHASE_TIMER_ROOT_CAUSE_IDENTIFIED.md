# ✅ Phase Timer 00:00:00 - Root Cause Identified & Solution

**Issue**: Dashboard shows "TEMPO TOTAL DA FASE: 00:00:00" after reset and Phase 1 reactivation
**Root Cause**: `phase_1_start_time` in event_config is NULL when it should be populated
**Solution**: See below

---

## 🔍 Root Cause Analysis

### The Timeline

1. **User clicks "Reset"**
   - ✅ `phase_1_start_time = NULL` (correct)
   - ✅ `current_phase = 0`
   - ✅ `event_started = false`

2. **User clicks "Reativar Fase 1"** (calls `/api/admin/start-phase-with-quests`)
   - ✅ Endpoint receives `{ phase: 1 }`
   - ✅ Line 58: Should set `updateData['phase_1_start_time'] = getUTCTimestamp()`
   - ✅ Line 58: Should set `updateData['event_start_time'] = getUTCTimestamp()` (if first time)
   - ✅ Line 73-76: Should execute the update via `supabaseAdmin`

3. **But something is failing**
   - ❌ Dashboard still shows "00:00:00"
   - ❌ This means `phase_1_start_time` is still NULL after the update

### Why?

There are 3 possible reasons:

**Reason 1**: The endpoint is being called but the update is failing silently
**Reason 2**: The endpoint is not being called at all
**Reason 3**: There's a caching issue in the browser/hook

---

## 🔧 Solution

### Step 1: Immediate Workaround (Manual SQL Update)

If you need the system working NOW, run this in Supabase SQL Editor:

```sql
-- Set Phase 1 start time to NOW
UPDATE event_config
SET phase_1_start_time = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verify
SELECT
  current_phase,
  phase_1_start_time,
  NOW() as current_time
FROM event_config
WHERE id = '00000000-0000-0000-0000-000000000001';
```

Then:
1. Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Dashboard should immediately show the timer

---

### Step 2: Add Diagnostic Logging (Find the Real Issue)

Edit `src/app/api/admin/start-phase-with-quests/route.ts`:

**Current** (lines 49-84):
```typescript
const updateData: any = {
  current_phase: phase,
}

if (phase >= 1) {
  updateData.event_started = true
  updateData.event_ended = false
  updateData[`phase_${phase}_start_time`] = getUTCTimestamp()

  if (phase === 1) {
    updateData.event_start_time = getUTCTimestamp()
  }
}

const { error: configError } = await supabaseAdmin
  .from('event_config')
  .update(updateData)
  .eq('id', eventConfigId)

if (configError) {
  console.error('Erro ao atualizar event_config:', configError)
  return NextResponse.json(...)
}
```

**Add logging** (line 85, right after the update):

```typescript
if (!configError) {
  // ✅ VERIFY the update actually persisted
  const { data: verifyData } = await supabaseAdmin
    .from('event_config')
    .select(`phase_${phase}_start_time`)
    .eq('id', eventConfigId)
    .single()

  console.log(`✅ Phase ${phase} started at:`, updateData[`phase_${phase}_start_time`])
  console.log(`✅ Verification - database value:`, verifyData?.[`phase_${phase}_start_time`])

  // If they don't match, there's a database issue
  if (updateData[`phase_${phase}_start_time`] !== verifyData?.[`phase_${phase}_start_time`]) {
    console.error('⚠️ DATABASE MISMATCH - Update may not have persisted')
  }
}
```

Then:
1. Make the code change above
2. Deploy (or restart dev server)
3. Click "Reset" then "Reativar Fase 1"
4. Check Server Logs (Vercel/local terminal)
5. Share the logs with analysis

---

### Step 3: Force a Hook Refresh (If Caching Issue)

If the update IS working (via SQL verification), but hook isn't picking it up:

Edit `src/app/live-dashboard/page.tsx`:

**Current**:
```typescript
const phase = useRealtimePhase()  // Default 5-second refresh
```

**Change to**:
```typescript
const phase = useRealtimePhase(2000)  // 2-second refresh for immediate updates
```

Also add a manual refresh button to the dashboard:

```typescript
'use client'

import { useRef } from 'react'
import { useRealtimePhase } from '@/lib/hooks/useRealtime'

export default function LiveDashboard() {
  const phaseRef = useRef<any>(null)
  const phase = useRealtimePhase(2000)

  const handleManualRefresh = () => {
    // Force a full page reload to ensure fresh data
    window.location.reload()
  }

  return (
    <div>
      <button
        onClick={handleManualRefresh}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        🔄 Refresh Dashboard
      </button>

      {/* Rest of dashboard */}
    </div>
  )
}
```

---

### Step 4: Permanent Fix (If Endpoint Issue)

If logs show the endpoint update is FAILING, it's likely a permissions issue.

Check `start-phase-with-quests/route.ts` line 40:

```typescript
// Using service_role - should have full permissions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ← This needs to be correct
  ...
)
```

**Verify**:
1. Environment variable `SUPABASE_SERVICE_ROLE_KEY` is set
2. Value is correct (get from Supabase Project Settings → API)
3. Redeploy with correct key

---

## 📋 Quick Diagnosis Flowchart

```
Phase Timer shows 00:00:00?
   │
   ├─ Check: Is phase_1_start_time NULL in database?
   │  (Run CHECK_EVENT_CONFIG.sql)
   │
   ├─ YES (NULL):
   │  │
   │  ├─ Add logging to endpoint (Step 2)
   │  ├─ Click "Reativar Fase 1"
   │  ├─ Check server logs
   │  │
   │  ├─ Logs show "✅ Phase 1 started at: [timestamp]"?
   │  │  │
   │  │  ├─ YES: Hook refresh issue (Step 3)
   │  │  └─ NO: Endpoint update failing (Step 4)
   │  │
   │  └─ MEANWHILE: Run manual SQL update (Step 1) to unblock
   │
   └─ NO (has timestamp):
      │
      └─ Issue is in CurrentQuestTimer component
         (Need to add NULL checks, see next section)
```

---

## 📊 Component Safety (CurrentQuestTimer.tsx)

Even if `phase_1_start_time` is set correctly, the component should handle NULL gracefully.

Edit `src/components/dashboard/CurrentQuestTimer.tsx` (line 288):

```typescript
const calculateTimeLeft = () => {
  // ⚠️ SAFETY CHECK: Handle NULL/undefined
  if (!phaseStartedAt) {
    console.warn('⚠️ WARNING: phaseStartedAt is null or undefined')
    console.warn('   This means phase_1_start_time is not set in event_config')
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

  const startTime = new Date(ensureZFormat).getTime()
  const now = new Date().getTime()

  // ⚠️ SAFETY CHECK: Ensure startTime is valid
  if (isNaN(startTime)) {
    console.error('❌ ERROR: Could not parse phaseStartedAt timestamp:', phaseStartedAt)
    setTimeLeft({
      hours: 0,
      minutes: 0,
      seconds: 0,
      percentage: 0
    })
    return
  }

  const elapsed = now - startTime
  const totalDuration = phaseDurationMinutes * 60 * 1000

  // ... rest of calculation
}
```

---

## 🎯 Complete Fix Checklist

- [ ] **Immediate**: Run manual SQL update (Step 1) if needed
- [ ] **Diagnosis**: Add logging to endpoint (Step 2)
- [ ] **Testing**: Click "Reativar Fase 1" and check logs
- [ ] **Quick Fix**: If cache issue, reduce refresh interval (Step 3)
- [ ] **Safety**: Add NULL checks to component
- [ ] **Long-term**: If endpoint failing, verify environment variables (Step 4)
- [ ] **Verify**: Hard refresh browser and confirm timer shows correct time

---

## 📝 Files to Modify

1. `src/app/api/admin/start-phase-with-quests/route.ts` (add diagnostic logging)
2. `src/components/dashboard/CurrentQuestTimer.tsx` (add NULL checks)
3. `src/app/live-dashboard/page.tsx` (optional: reduce refresh interval)

---

**Status**: 🔧 Ready for implementation
**Complexity**: Low-Medium
**Time**: 5-10 minutes to diagnose + fix
**Risk**: Very Low (non-breaking changes)
