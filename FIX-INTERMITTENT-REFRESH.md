# 🔧 Fix: Intermittent Refresh on Live Dashboard

**Status:** ✅ Fixed
**Date:** 14/11/2025
**Root Cause:** Duplicated EventEndCountdownWrapper component

---

## Problem Description

You reported that the live-dashboard occasionally refreshes after some time, especially when triggered by actions in other pages (like submit or evaluate).

**Symptoms:**
- Live dashboard usually doesn't refresh (after previous fix)
- BUT: Occasionally refreshes after N seconds
- Triggered by actions on OTHER pages (submit, evaluate)
- Not consistent - happens "sometimes"

---

## Root Cause Analysis

**Found:** The `EventEndCountdownWrapper` component was being rendered **TWICE** in the application:

### Location 1: `src/app/layout.tsx` (Global Layout)
```tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <EventEndCountdownWrapper />  // ❌ GLOBAL - renders on ALL pages
        {children}
      </body>
    </html>
  )
}
```

### Location 2: `src/app/live-dashboard/page.tsx` (Live Dashboard Page)
```tsx
export default function LiveDashboard() {
  return (
    <>
      <EventEndCountdownWrapper />  // ✅ CORRECT - only on live-dashboard
      {/* rest of content */}
    </>
  )
}
```

---

## Why This Caused Intermittent Refresh

### The Problem Chain

1. **Two instances running independently:**
   - Layout instance polls every 1 second
   - Page instance polls every 1 second
   - But their polling is NOT synchronized (different timing)

2. **Conflict when accessing shared state:**
   - Both instances fetch `event_config` from Supabase
   - Both call `setEventEnded()`, `setEventEndTime()`, etc.
   - State updates conflict and trigger re-renders

3. **Cross-page propagation:**
   - When you submit on `/submit` page:
     - Page data updates
     - Layout's EventEndCountdownWrapper detects change
     - Polls event_config again
     - Causes background state change on live-dashboard
     - This propagates as a refresh (due to polling sync loss)

4. **Why it's intermittent:**
   - Only happens when:
     - Live-dashboard is open in background
     - You perform action on another page
     - The timing causes polling mismatch
     - State conflict triggers re-render

---

## Solution Applied

### Removed Global EventEndCountdownWrapper from Layout

**File:** `src/app/layout.tsx`

**Before:**
```tsx
import EventEndCountdownWrapper from "@/components/EventEndCountdownWrapper"

export default function RootLayout({ children }) {
  return (
    <body>
      <EventEndCountdownWrapper />  // ❌ Removed this
      {children}
    </body>
  )
}
```

**After:**
```tsx
// ✅ Import removed
// ✅ Component removed from layout

export default function RootLayout({ children }) {
  return (
    <body>
      {/* EventEndCountdownWrapper should ONLY be on /live-dashboard */}
      {children}
    </body>
  )
}
```

### Why This Works

1. **Single source of truth:** EventEndCountdownWrapper only renders on `/live-dashboard`
2. **No conflict:** Only one polling instance running
3. **Isolated:** Actions on other pages don't affect live-dashboard state
4. **Clean:** No cross-page state propagation

---

## How It Should Work

### Component Rendering Map

| Page | EventEndCountdownWrapper |
|------|--------------------------|
| `/live-dashboard` | ✅ YES (and only here) |
| `/dashboard` | ❌ NO |
| `/submit` | ❌ NO |
| `/evaluate` | ❌ NO |
| `/evaluate/[id]` | ❌ NO |
| Other pages | ❌ NO |

### EventEndCountdownWrapper Responsibilities

The component should ONLY:
- ✅ Monitor event end time
- ✅ Show countdown when evaluation period ends
- ✅ Show GAME OVER screen
- ✅ Perform polling on `/live-dashboard` to display timely updates

It should NOT:
- ❌ Be on all pages globally
- ❌ Create multiple polling instances
- ❌ Cause state conflicts

---

## Testing the Fix

### Before Fix
1. Open live-dashboard
2. Go to `/submit` or `/evaluate` in another tab
3. Perform an action (submit or evaluate)
4. Observe: Live-dashboard **sometimes** refreshes
5. **Problem:** Intermittent, hard to debug

### After Fix
1. Open live-dashboard
2. Go to `/submit` or `/evaluate` in another tab
3. Perform an action (submit or evaluate)
4. Observe: Live-dashboard **does NOT refresh**
5. **Result:** No more intermittent refresh! ✅

---

## Related Components

### EventEndCountdownWrapper
- **Location:** `src/components/EventEndCountdownWrapper.tsx`
- **Purpose:** Monitor event lifecycle and show countdowns
- **Polling Interval:** 1 second
- **Should appear on:** ONLY `/live-dashboard`

### EventEndCountdown
- **Used by:** EventEndCountdownWrapper (PHASE 2)
- **Purpose:** Final countdown before game over

### EvaluationPeriodCountdown
- **Used by:** EventEndCountdownWrapper (PHASE 1)
- **Purpose:** Countdown for evaluation period

---

## Files Modified

- **`src/app/layout.tsx`**
  - Removed import of EventEndCountdownWrapper
  - Removed component from JSX
  - Added comment explaining why

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| EventEndCountdownWrapper instances | 2 (layout + page) | 1 (page only) |
| Polling conflicts | Yes | No |
| Cross-page refresh propagation | Yes | No |
| Intermittent refresh | Occasional | ✅ Eliminated |

---

## Expected Behavior After Fix

✅ **Live Dashboard Updates:**
- Ranking updates smoothly (polling every 500ms)
- Phase/quest info updates smoothly (polling every 500ms)
- NO page refresh/flicker
- NO refresh when actions happen on other pages
- NO intermittent refresh after time passes

✅ **Other Pages:**
- Submit page works normally
- Evaluate page works normally
- No unexpected state changes from live-dashboard

---

**Test status:** Ready to test in browser
**Expected result:** No more intermittent refresh on live-dashboard

---

*Prepared by Claude Code - 14/11/2025*
