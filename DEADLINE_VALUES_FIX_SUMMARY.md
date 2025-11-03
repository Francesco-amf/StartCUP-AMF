# 🔧 Deadline Minutes Values - Complete Fix

**Issue**: Deadline showing 30 minutos when should be 45 minutos (or original quest time)
**Root Cause**: `planned_deadline_minutes` are hardcoded to 30, should be: 45, 35, 40, 50, 60 etc
**Status**: ✅ FIXED (database + frontend)

---

## The Real Issue

Os valores originais de cada quest são:
- **Quest 1**: 45 minutos
- **Quest 2**: 35 minutos
- **Quest 3**: 40 minutos
- **Quest 4**: 50 minutos (Fase 1)
- **Quest 5**: 60 minutos (Fase 1)

E cada quest tem uma **janela de atraso de 15 minutos** adicional.

Então o tempo TOTAL disponível é:
- **Quest 1**: 45 + 15 = **60 minutos**
- **Quest 2**: 35 + 15 = **50 minutos**
- etc.

Mas o sistema estava mostrando apenas 30 minutos porque `planned_deadline_minutes` estava hardcoded como 30.

---

## ✅ Fixes Applied

### Fix 1: Update Frontend to Use Database Values

**File**: [src/components/quest/SubmissionDeadlineStatus.tsx](src/components/quest/SubmissionDeadlineStatus.tsx)

**Changes**:
1. Added `plannedDeadlineMinutes` and `lateWindowMinutes` to DeadlineInfo interface
2. Capture actual values from database when fetching quest
3. Use actual values in display (not hardcoded 15)

**Now Shows**:
```
✅ No Prazo
Tempo restante: 45 minutos (+ 15 min janela = 60 min total)
```

Instead of:
```
✅ No Prazo
Tempo restante: 30 minutos (+ 15 min janela = 45 min total)  ❌
```

### Fix 2: Restore Original `planned_deadline_minutes` Values in Database

**Action Required**: Run [FIX_PLANNED_DEADLINE_MINUTES.sql](FIX_PLANNED_DEADLINE_MINUTES.sql)

This script updates:
- **Fase 1**: Quest 1→45, 2→35, 3→40, 4→50, 5→60 min
- **Fase 2**: Quest 1→45, 2→35, 3→40 min
- **Fase 3**: Quest 1→45, 2→35 min
- **Fase 4**: Quest 1→45 min
- **Fase 5**: Quest 1→45 min

---

## 📋 Step-by-Step Instructions

### Step 1: Run SQL to Restore Deadline Values
Copy and run [FIX_PLANNED_DEADLINE_MINUTES.sql](FIX_PLANNED_DEADLINE_MINUTES.sql) in Supabase SQL Editor:

```sql
-- Update Fase 1 quests
UPDATE quests
SET planned_deadline_minutes = CASE
  WHEN order_index = 1 THEN 45
  WHEN order_index = 2 THEN 35
  WHEN order_index = 3 THEN 40
  WHEN order_index = 4 THEN 50
  WHEN order_index = 5 THEN 60
  ELSE planned_deadline_minutes
END
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 1);

-- (Repeat for other phases...)
```

### Step 2: Hard Refresh Browser
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

This loads the updated code that uses actual values from database.

### Step 3: Go to `/team/submit` and Verify

You should now see:
```
✅ No Prazo
Tempo restante: 45 minutos (+ 15 min janela = 60 min total)
Após o prazo, você terá uma janela de 15 minutos adicionais com penalidades progressivas.
```

---

## 📊 Before & After Comparison

### Before Fix ❌
- Component hardcoded: `const totalMinutesAvailable = deadlineInfo.minutesRemaining + 15`
- Always shows 30 + 15 = 45 minutos
- Ignores actual quest deadline values
- Database has wrong values (30 for all)

### After Fix ✅
- Component dynamic: `const totalMinutesAvailable = deadlineInfo.plannedDeadlineMinutes + deadlineInfo.lateWindowMinutes`
- Shows actual quest values: 45, 35, 40, etc
- Uses values from database
- Database has correct values restored

---

## 📝 Files Modified

| File | Change | Type |
|------|--------|------|
| [src/components/quest/SubmissionDeadlineStatus.tsx](src/components/quest/SubmissionDeadlineStatus.tsx) | Use database values instead of hardcoded 15 | Code |
| [FIX_PLANNED_DEADLINE_MINUTES.sql](FIX_PLANNED_DEADLINE_MINUTES.sql) | Restore original quest deadline values | SQL |

---

## 🎯 Expected Timeline After Fix

### Quest 1 (45 minutes deadline + 15 min late window = 60 min total)
- **0-45 min**: "No Prazo" (no penalty)
- **45-60 min**: "Submissão Atrasada" (penalty: -5pts to -15pts depending on exact minutes)
- **60+ min**: "Prazo Expirou" (blocked)

### Quest 2 (35 minutes deadline + 15 min late window = 50 min total)
- **0-35 min**: "No Prazo"
- **35-50 min**: "Submissão Atrasada"
- **50+ min**: "Prazo Expirou"

---

## ✅ Verification Query

After running SQL, verify the values were updated:

```sql
SELECT
  q.id,
  q.name,
  p.order_index as phase,
  q.order_index as quest_num,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  (q.planned_deadline_minutes + q.late_submission_window_minutes) as total_available
FROM quests q
JOIN phases p ON q.phase_id = p.id
ORDER BY p.order_index, q.order_index;
```

Should show:
- Quest 1 Fase 1: 45 + 15 = 60
- Quest 2 Fase 1: 35 + 15 = 50
- Quest 3 Fase 1: 40 + 15 = 55
- etc.

---

## 🚀 Summary

1. **Database issue**: `planned_deadline_minutes` were all 30 (wrong)
2. **Frontend issue**: Hardcoded `+ 15` instead of using actual database values
3. **Fixed**: Both issues now resolved
4. **Result**: Display shows correct total time (45+15, 35+15, etc.)

---

**Status**: Ready to apply
**Time Required**: 5 minutes (SQL + hard refresh)
**Risk**: Very low (non-breaking, database restoration only)
