# 🔴 Late Submission Blocking Issue - Analysis & Solution

**Issue Report**: "Mesmo estando na janela de 15 min diz que o prazo expirou"
**Translation**: "Even being in the 15 min window, it says deadline expired"
**Status**: Investigating
**Date**: 2 de Novembro de 2025

---

## Problem Description

### What Happened
1. User submitted Quest 1 AFTER the 30-minute deadline
2. System should allow submission within the 15-minute late window
3. But system returned: "Prazo para submissão expirou" (deadline expired)
4. File upload was blocked

### Expected Behavior
✅ Quest deadline: 30 minutes
✅ Late window: Additional 15 minutes (total 45 minutes)
✅ At minute 40 (within late window): Should allow submission with penalty
❌ But got: "Deadline expired" error

---

## Root Cause Analysis

The problem is likely ONE of these:

### Cause 1: Timezone Issue (Most Likely ⚡)
**The `validate_submission_allowed` RPC function uses `NOW()`**

```sql
v_now := NOW();
```

If the Postgres server has timezone issues (same as the Node.js `getUTCTimestamp()` problem), then:
- `NOW()` might return local time interpreted as UTC
- Deadline calculation would be off by 3 hours
- Latest deadline would appear to be in the past

**Example**:
```
Deadline stored: 2025-11-02T17:30:00Z (in database, "correct" at the time)
NOW() returns: 2025-11-02T17:35:00Z (server thinks it's this time)
Actual time: 2025-11-02T20:35:00Z (is actually this, UTC)

Difference: 3 hours past deadline, outside 15-minute window!
Result: "Prazo expirou"
```

### Cause 2: `planned_deadline_minutes` Or `late_submission_window_minutes` Are NULL Or 0

```sql
-- From validate_submission_allowed (line 149):
v_deadline := v_quest.started_at + (v_quest.planned_deadline_minutes || ' minutes')::interval;

-- If v_quest.planned_deadline_minutes = NULL or 0:
-- Then deadline = started_at (no minutes added!)
-- So NOW() > deadline immediately
```

### Cause 3: `started_at` Is NULL

```sql
-- Line 142:
IF v_quest.started_at IS NULL THEN
  is_allowed := FALSE;
  reason := 'Quest ainda não começou';
  RETURN;
END IF;
```

But this gives a different message, so unlikely.

### Cause 4: `allow_late_submissions` Is FALSE

Not checked in the validation function! This would need to be verified.

---

## How to Diagnose (CRITICAL!)

### Step 1: Run Diagnostic SQL
Run ALL queries in [LATE_SUBMISSION_DEBUG.sql](LATE_SUBMISSION_DEBUG.sql) in Supabase SQL Editor:

1. **Query 1**: Shows current state of Quest 1
   - Expected: `status_atual = 'Na janela de atraso'`
   - If wrong: Timezone or time calculation issue

2. **Query 2**: Tests the RPC function directly
   - Expected: `is_allowed = TRUE` and `reason = 'Submissão atrasada, será aplicada penalidade'`
   - If `is_allowed = FALSE`: The function is rejecting it

3. **Query 5**: Checks quest configuration
   - Expected: `planned_deadline_minutes = 30` and `late_submission_window_minutes = 15`
   - If `NULL` or `0`: That's the bug!

4. **Query 6**: Manual calculation
   - Expected: `penalidade_esperada = '-Xpts'` (not 'Bloqueado')
   - If 'Bloqueado': Over 15 minutes

---

## Likely Solution

### Fix 1: Update Postgres `NOW()` Timezone (Server-Side)
If Postgres server is in local timezone, it should be UTC:

```sql
-- Check current timezone
SHOW timezone;

-- Should return: 'UTC'
-- If it shows: 'America/Sao_Paulo' or similar, that's the problem!

-- Set to UTC:
SET timezone = 'UTC';

-- Make it permanent (superuser only):
ALTER USER your_user SET timezone = 'UTC';
```

### Fix 2: Ensure Quest Config Is Correct
```sql
-- Verify planned_deadline_minutes and late_submission_window_minutes
SELECT planned_deadline_minutes, late_submission_window_minutes
FROM quests
WHERE id = '...' AND order_index = 1;

-- Should show: 30 and 15 (or similar non-null values)
-- If NULL or 0: Update them!

UPDATE quests
SET
  planned_deadline_minutes = 30,
  late_submission_window_minutes = 15,
  allow_late_submissions = TRUE
WHERE order_index = 1 AND phase_id IN (
  SELECT id FROM phases WHERE order_index = 1
);
```

### Fix 3: Update Frontend Error Message (Clarity)
Even if the blocking is correct, the error message "Prazo para submissão expirou" is confusing. It should distinguish between:
- ❌ "Prazo normal expirou (há X minutos)" - Submission is in late window, will have penalty
- ❌ "Janela de atraso expirou" - No more submissions allowed

The current message combines both, causing confusion.

---

## Immediate Action Items

### Step 1: Diagnose (15 minutes)
1. Open Supabase SQL Editor
2. Run [LATE_SUBMISSION_DEBUG.sql](LATE_SUBMISSION_DEBUG.sql)
3. Copy results and share with me

### Step 2: Most Likely Fix (If Timezone Issue)
If timezone is the problem:

**In Supabase dashboard**:
1. Go to Settings → Database
2. Check current timezone
3. If not UTC, contact support or use SQL:
   ```sql
   ALTER DATABASE your_db SET timezone = 'UTC';
   ```

### Step 3: Alternative Fix (If Config Issue)
If `planned_deadline_minutes` is NULL:

```sql
UPDATE quests
SET planned_deadline_minutes = 30
WHERE planned_deadline_minutes IS NULL;
```

---

## Code Review (For Reference)

The logic in `validate_submission_allowed` appears **correct** (lines 95-182):

1. ✅ Calculates deadline: `started_at + planned_deadline_minutes`
2. ✅ Calculates late window end: `deadline + late_submission_window_minutes`
3. ✅ Checks if `NOW() > late_window_end` → blocks
4. ✅ Checks if `deadline < NOW() < late_window_end` → allows with penalty

**The problem is likely in the DATA or DATABASE CONFIGURATION, not the SQL logic.**

---

## Timeline

```
You tried to submit: Minute 40 of quest (deadline=30, late window=15)
System said: "Prazo expirou" (Deadline expired)

Expected:
- Deadline at: Minute 30
- Late window closes at: Minute 45
- You at minute 40: Should be IN WINDOW ✅

Got:
- System thinks you're PAST the window ❌

Why?
- Server timezone is wrong, OR
- planned_deadline_minutes is NULL/0, OR
- started_at has wrong time
```

---

## Testing After Fix

### If You Fix Timezone:
1. Run diagnostic SQL again
2. Try submitting a file
3. Should see: "Submissão atrasada, será aplicada penalidade" message
4. Submission should succeed with -5pts to -15pts penalty

### If You Fix Config:
1. Update `planned_deadline_minutes` and `late_submission_window_minutes`
2. Try submitting
3. Should succeed with appropriate penalty

---

## References

| File | Content |
|------|---------|
| [LATE_SUBMISSION_DEBUG.sql](LATE_SUBMISSION_DEBUG.sql) | Diagnostic queries |
| [add-late-submission-system.sql](add-late-submission-system.sql) | Full RPC function code |
| [SubmissionForm.tsx](src/components/forms/SubmissionForm.tsx) | Frontend error handling |

---

## Next Steps

1. **Run the diagnostic SQL** and share results
2. **Identify root cause** (timezone, config, or other)
3. **Apply appropriate fix**
4. **Test with another submission**
5. **Verify penalty is applied correctly**

---

**Status**: Waiting for diagnostic results
**Urgency**: High (blocks late submissions)
**Impact**: Users cannot submit during late window

---

## Quick Checklist

- [ ] Ran all 6 queries from LATE_SUBMISSION_DEBUG.sql
- [ ] Checked PostgreSQL timezone (should be UTC)
- [ ] Verified planned_deadline_minutes = 30 (not NULL)
- [ ] Verified late_submission_window_minutes = 15 (not NULL)
- [ ] Query 2 returned is_allowed = TRUE
- [ ] Tried submitting again after fix
