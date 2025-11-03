# ⚡ Late Submission - Quick Fix Guide

**Issue**: Can't submit during 15-minute late window, getting "Prazo expirou" error
**Status**: Diagnostics ready
**Time to fix**: 10-15 minutes

---

## 🚀 Quick Diagnosis (Copy & Paste Ready)

Run these queries **ONE AT A TIME** in Supabase SQL Editor:

### Query 1: Check Current Status (Most Important!)
```sql
SELECT
  q.id,
  q.name,
  q.status,
  q.started_at,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  NOW() as agora,
  (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) as deadline,
  CASE
    WHEN NOW() < (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) THEN 'No prazo ✅'
    WHEN NOW() < (q.started_at + (q.planned_deadline_minutes || ' minutes')::interval) + (q.late_submission_window_minutes || ' minutes')::interval THEN 'Na janela de atraso ⏰'
    ELSE 'Passou da janela ❌'
  END as status_atual
FROM quests q
JOIN phases p ON q.phase_id = p.id
WHERE p.order_index = 1 AND q.order_index = 1;
```

**What to look for**:
- `status_atual` should say **"Na janela de atraso ⏰"**
- If it says "Passou da janela ❌": deadline calculation is wrong

### Query 2: Test Validation Function
```sql
WITH quest_info AS (
  SELECT q.id as quest_id, t.id as team_id
  FROM quests q
  JOIN phases p ON q.phase_id = p.id
  JOIN teams t ON t.name = 'Equipe Alpha'
  WHERE p.order_index = 1 AND q.order_index = 1
  LIMIT 1
)
SELECT
  (validate_submission_allowed(
    (SELECT team_id FROM quest_info),
    (SELECT quest_id FROM quest_info)
  )).*;
```

**What to look for**:
- `is_allowed` should be **TRUE**
- `reason` should say **"Submissão atrasada, será aplicada penalidade"**
- If `is_allowed` is FALSE: there's a bug

### Query 3: Check Quest Configuration
```sql
SELECT
  q.id,
  q.name,
  q.planned_deadline_minutes,
  q.late_submission_window_minutes,
  q.allow_late_submissions
FROM quests q
WHERE q.order_index = 1
  AND q.phase_id IN (SELECT id FROM phases WHERE order_index = 1);
```

**What to look for**:
- `planned_deadline_minutes` should be **30** (not NULL or 0)
- `late_submission_window_minutes` should be **15** (not NULL or 0)
- `allow_late_submissions` should be **TRUE**

---

## 🔧 Fixes (Choose Based on Query Results)

### Fix A: Configure Missing Deadline Values
**Use if Query 3 shows NULL or 0 values:**

```sql
UPDATE quests
SET
  planned_deadline_minutes = 30,
  late_submission_window_minutes = 15,
  allow_late_submissions = TRUE
WHERE order_index = 1
  AND phase_id IN (SELECT id FROM phases WHERE order_index = 1);
```

### Fix B: Check PostgreSQL Timezone
**Use if Query 1 shows wrong status or Query 2 returns is_allowed = FALSE:**

Run this to check timezone:
```sql
SHOW timezone;
```

**Result should be**: `UTC`

If it shows something else like `America/Sao_Paulo`:
1. Contact Supabase support to change database timezone to UTC, OR
2. Use this (if you have permissions):
```sql
ALTER DATABASE your_database_name SET timezone = 'UTC';
```

Then **restart your application**.

### Fix C: Reset Phase and Reactivate
**Use if queries look OK but submissions still fail:**

```sql
-- Reset Phase 0
UPDATE event_config
SET
  current_phase = 0,
  event_started = FALSE,
  event_started = FALSE
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Reset quests
UPDATE quests
SET status = 'scheduled', started_at = NULL, ended_at = NULL
WHERE status IN ('active', 'closed');
```

Then in admin panel: **Activate Phase 1 again**

This will use the corrected `getUTCTimestamp()` function.

---

## 📋 Decision Tree

```
Run Query 1:
├─ "Na janela de atraso ⏰"?
│  └─ YES → Run Query 2
│     ├─ is_allowed = TRUE?
│     │  └─ YES → Try submitting (may work now!)
│     │  └─ NO → Apply Fix B (timezone issue)
│     └─ NO → Apply Fix A (quest config)
└─ "Passou da janela ❌"?
   └─ Apply Fix B or Fix C (timezone + reset)
```

---

## ✅ Test After Fix

1. Go to `/team/submit`
2. Try uploading a file for Quest 1
3. Should see one of:
   - ✅ "Submissão atrasada, será aplicada penalidade" (working!)
   - ✅ File uploads successfully
   - ✅ Message shows penalty: "-5pts" to "-15pts"

---

## 📊 Expected Behavior

| Time | Status | Penalty | Can Submit? |
|------|--------|---------|------------|
| 0-30 min | No prazo | None | ✅ Yes |
| 30-35 min | Late | -5pts | ✅ Yes |
| 35-40 min | Late | -10pts | ✅ Yes |
| 40-45 min | Late | -15pts | ✅ Yes |
| >45 min | Expired | - | ❌ No |

---

## 🆘 Still Having Issues?

Share the results of these 3 queries and I can help pinpoint the exact problem:
1. Query 1 output (`status_atual` column)
2. Query 2 output (`is_allowed` and `reason` columns)
3. Query 3 output (`planned_deadline_minutes`, `late_submission_window_minutes` values)

---

**Last Updated**: 2 de Novembro de 2025
**Status**: Ready to test
