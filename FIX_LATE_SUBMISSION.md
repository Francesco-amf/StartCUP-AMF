# 🔧 Fix: Late Submission Window Blocking

**Problem**: Query 1 = "Passou da janela ❌", Query 2 = FALSE
**Root Cause**: `started_at` timestamp is from BEFORE we fixed the UTC issue
**Solution**: Reset Phase 0 and reactivate Phase 1 to get new correct timestamps

---

## ✅ The Fix (Admin Action Only - 2 minutes)

### Step 1: Reset Phase to 0 (Preparação)
In your admin panel:
1. Click the **Reset button** or **"Reset to Preparação"** option
2. Confirm you want to reset all quests
3. Wait for success message

This will:
- Set all quests back to `scheduled` status
- Clear all `started_at` timestamps
- Reset submissions (they'll still exist but become "historical")

### Step 2: Reactivate Phase 1
In your admin panel:
1. Click **"Activate Phase 1"** button
2. Wait for success message

This will:
- Set current_phase = 1
- Activate the first quest of Phase 1
- **Use the NEW `getUTCTimestamp()` function** ✅
- Set correct `started_at` timestamp

### Step 3: Try Submitting Again
1. Go to `/team/submit`
2. Try uploading a file for Quest 1
3. You should now see: **"Submissão atrasada, será aplicada penalidade"** message
4. Submission should succeed with penalty (-5pts to -15pts)

---

## 🔍 Verify The Fix Worked

Run this SQL after reactivating Phase 1:

```sql
SELECT
  q.id,
  q.name,
  q.started_at,
  NOW() as agora,
  EXTRACT(EPOCH FROM (NOW() - q.started_at)) / 60 as minutos_desde_inicio,
  CASE
    WHEN NOW() < (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) + (q.late_submission_window_minutes || ' minutes')::interval THEN '✅ NA JANELA'
    ELSE '❌ PASSOU DA JANELA'
  END as status
FROM quests q
WHERE q.status = 'active' AND q.order_index = 1;
```

Expected result: **"✅ NA JANELA"** and `minutos_desde_inicio` should be small (like 5-10 minutes, not hours)

---

## 📝 Why This Fixes It

### Before Fix:
1. Quest activated with OLD `new Date().toISOString()` function
2. This gave WRONG `started_at` timestamp (hours in the past)
3. Deadline was calculated as: old_started_at + 30 min
4. Since started_at was old, deadline was already passed
5. Late window was also passed → ❌ "Passou da janela"

### After Fix:
1. Quest activated with NEW `getUTCTimestamp()` function
2. This gives CORRECT `started_at` timestamp (NOW in UTC)
3. Deadline is calculated as: now_started_at + 30 min
4. Deadline is in the future (or recently passed)
5. 15-minute late window is still open → ✅ "Na janela de atraso"

---

## 🎯 Expected Timeline After Fix

When you reactivate Phase 1:
- **Minute 0-30**: No prazo (no penalty)
- **Minute 30-45**: Na janela de atraso (penalty: -5pts to -15pts)
- **Minute 45+**: Passou da janela (blocked)

Currently you're probably past minute 45 because started_at was set hours ago.

---

## ⚠️ Important Notes

### About Existing Submissions
- ✅ All existing submissions will remain in the database
- ✅ They won't be deleted
- ✅ They'll show in history
- ✅ Scores won't change
- ✅ Only active quest gets reset

### About Resetting Phase
- This is SAFE - it's designed to reset between testing phases
- You can do this multiple times
- Admin can reset anytime to start over

---

## 🚀 After This Fix

Once Phase 1 is reactivated with correct timestamps:
1. Team should be able to submit within the 15-minute late window
2. Submissions should show penalty messages
3. Penalty points should be deducted
4. Next phase can proceed normally

---

## If It Still Doesn't Work

After reactivating Phase 1, if you STILL get "Passou da janela":

1. Check if there's another issue blocking submissions
2. Run the SQL in CHECK_STARTED_AT.sql to see exact timestamps
3. Share the results with me

But this should fix it! 🎯

---

**Status**: Ready to apply
**Time Required**: 2 minutes (admin panel reset + reactivate)
**Risk Level**: Very Low (reversible, designed for testing)
