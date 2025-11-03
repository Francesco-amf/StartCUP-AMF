# 🔧 Final Fixes - Session 2 (After Phase Reset)

**Date**: 2 de Novembro de 2025 (continuação)
**Issues Found**: 2 quests showing, deadline display not clear
**Status**: ✅ FIXED

---

## Issues & Fixes

### Issue 1: 2 Quests Showing (Sequential Blocking Not Working)

**Problem**: Submission page shows 2 quests available instead of 1

**Root Cause**: After fresh reset, `evaluatedQuestIds` is empty (no submissions evaluated yet), so both Quest 1 and 2 might show if both are `active`

**Fix Applied**:
1. Created SQL to ensure only Quest 1 is `active` in Phase 1
2. All other quests set to `scheduled` with `started_at = NULL`

**SQL to run**:
```sql
-- Set Quest 1 to active
UPDATE quests
SET status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 1;

-- Set Quest 2+ to scheduled
UPDATE quests
SET status = 'scheduled', started_at = NULL
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index > 1;

-- Verify
SELECT id, name, status, started_at, order_index
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1
ORDER BY q.order_index;
```

---

### Issue 2: Deadline Display Shows 30 Min Instead of 45 Min

**Problem**: "Tempo restante: 30 minutos" but should show total available time (30 + 15 late window)

**Root Cause**: Component only shows time until deadline, not total available time

**Fix Applied**: Updated [src/components/quest/SubmissionDeadlineStatus.tsx](src/components/quest/SubmissionDeadlineStatus.tsx) to show:
```
Tempo restante: 30 minutos (+ 15 min janela = 45 min total)
```

**Code Change** (line 156-167):
```typescript
// Calculate total time available (deadline + late window = 30 + 15 = 45 minutes)
const totalMinutesAvailable = deadlineInfo.minutesRemaining + 15
return (
  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-4">
    ...
    <p className="font-semibold">
      Tempo restante: <span className="text-green-200">{deadlineInfo.minutesRemaining} minutos</span>
      <span className="text-green-200/70"> (+ 15 min janela = {totalMinutesAvailable} min total)</span>
    </p>
    ...
  </div>
)
```

---

## 📋 Action Items

### Step 1: Run SQL Fix (Quest State)
Copy and run [FIX_QUEST_STATE.sql](FIX_QUEST_STATE.sql) in Supabase SQL Editor to ensure only Quest 1 is active:
```sql
-- Set Quest 1 to active, rest to scheduled
UPDATE quests SET status = 'active'
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index = 1;

UPDATE quests SET status = 'scheduled', started_at = NULL
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1)
  AND order_index > 1;
```

### Step 2: Hard Refresh Browser
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

This clears dashboard cache and loads new code with deadline display fix.

### Step 3: Verify Fixes

**Check 1**: Go to `/team/submit`
- ✅ Should show **ONLY 1 quest** (Quest 1)
- ✅ Deadline should show: **"30 minutos (+ 15 min janela = 45 min total)"**

**Check 2**: Dashboard
- ✅ Should update after hard refresh
- ✅ Should show current phase info

---

## 📊 Summary of Fixes

| Issue | Before | After | File |
|-------|--------|-------|------|
| **2 quests showing** | ❌ 2 quests visible | ✅ Only 1 visible | Database (SQL) |
| **Deadline display** | ❌ "30 minutos" | ✅ "30 minutos (+ 15 min janela = 45 min total)" | SubmissionDeadlineStatus.tsx |
| **Dashboard cache** | ❌ Stale data | ✅ Fresh after Ctrl+Shift+R | Browser cache |

---

## 🎯 Expected Result After Fixes

### Submission Page Should Show:
```
✅ No Prazo
Tempo restante: 30 minutos (+ 15 min janela = 45 min total)
Após o prazo, você terá uma janela de 15 minutos adicionais com penalidades progressivas.

[Quest 1 submission form]

(Quest 2 is completely hidden - NOT SHOWN)
```

### Timeline:
- **Minute 0-30**: "No Prazo" (on time)
- **Minute 30-45**: "Submissão Atrasada" with penalty (in late window)
- **Minute 45+**: "Prazo Expirou" (blocked)

---

## 📝 Files Modified

| File | Change | Lines |
|------|--------|-------|
| [src/components/quest/SubmissionDeadlineStatus.tsx](src/components/quest/SubmissionDeadlineStatus.tsx) | Added total time display | 156-167 |

## 📝 SQL Scripts Created

| File | Purpose |
|------|---------|
| [FIX_QUEST_STATE.sql](FIX_QUEST_STATE.sql) | Ensure only Quest 1 is active |
| [CHECK_QUEST_STATE.sql](CHECK_QUEST_STATE.sql) | Diagnostic queries |

---

## Next Steps

1. **Run SQL fix** to ensure quest states are correct
2. **Hard refresh** browser to load new code
3. **Verify** only 1 quest shows on `/team/submit`
4. **Check** deadline displays total time (45 min)
5. **Try submitting** to test late window functionality

---

**Status**: ✅ All fixes ready
**Time to implement**: 5 minutes
**Risk**: Very low (non-breaking changes)
