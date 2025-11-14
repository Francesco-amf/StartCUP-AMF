# 🚀 How to Apply Event Timing Changes

**Status**: All files prepared, ready for database update
**Date**: 2025-11-14

---

## Quick Summary

You requested:
1. ✅ Exit quick test mode → Restore normal timings
2. ✅ Remove Phase 5 boss (doesn't exist) → Remove 200 pts
3. ✅ Change late window from 1 min → 15 min

All changes have been prepared in:
- **[RESTORE_NORMAL_TIMINGS.sql](RESTORE_NORMAL_TIMINGS.sql)** ← Execute this to apply changes
- **[EVENT_TIMING_UPDATES_SUMMARY.md](EVENT_TIMING_UPDATES_SUMMARY.md)** ← Full documentation

---

## 📋 3-Step Implementation

### STEP 1: Open Supabase SQL Editor

1. Go to Supabase Console: https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**

---

### STEP 2: Copy & Execute SQL Script

1. Open file: [RESTORE_NORMAL_TIMINGS.sql](RESTORE_NORMAL_TIMINGS.sql)
2. **Copy ALL content** (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **"Run"** button (or Ctrl+Enter)

**Expected Output:**
```
✅ PHASES AFTER UPDATE
✅ QUESTS AFTER UPDATE
📊 SUMMARY OF CHANGES
```

---

### STEP 3: Verify Changes Applied

After execution, verify in Supabase:

**Check 1: Phases Updated**
```sql
SELECT
  p.order_index as fase,
  p.duration_minutes,
  p.max_points,
  COUNT(q.id) as num_quests
FROM phases p
LEFT JOIN quests q ON q.phase_id = p.id
WHERE p.order_index BETWEEN 1 AND 5
GROUP BY p.id, p.order_index, p.duration_minutes, p.max_points
ORDER BY p.order_index;
```

**Expected Results:**
| fase | duration_minutes | max_points | num_quests |
|------|------------------|-----------|-----------|
| 1    | 75               | 400       | 4         |
| 2    | 75               | 400       | 4         |
| 3    | 75               | 400       | 4         |
| 4    | 75               | 400       | 4         |
| 5    | 60               | 300       | 3         |

**Check 2: Late Window Updated**
```sql
SELECT DISTINCT late_submission_window_minutes
FROM quests
WHERE phase_id IN (SELECT id FROM phases WHERE order_index BETWEEN 1 AND 5);
```

**Expected Result:** `15` (only one row, value 15)

**Check 3: Phase 5 Has NO Boss**
```sql
SELECT COUNT(*) as quest_count
FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5);
```

**Expected Result:** `3` (NOT 4, no boss)

---

## 📊 What Changed

### Late Submission Window
| Before | After |
|--------|-------|
| 0.5 minutes (30 sec) | **15 minutes** |
| Applied to: All phases 1-5 | Applied to: All phases 1-5 |

### Phase Durations
| Phase | Before | After |
|-------|--------|-------|
| 1     | 8 min (test) | **75 min** |
| 2     | 8 min (test) | **75 min** |
| 3     | 8 min (test) | **75 min** |
| 4     | 8 min (test) | **75 min** |
| 5     | 6 min (test) | **60 min** |

### Phase 5 Structure
| Before | After |
|--------|-------|
| Unclear (test mode) | **3 quests ONLY** |
| Could have boss | **NO BOSS (removed)** |
| Max points: unclear | **300 pts (3×100)** |

### Quest Durations (Example: Phase 1)
| Quest | Before | After |
|-------|--------|-------|
| 1.1   | 2 min (test) | **20 min** |
| 1.2   | 2 min (test) | **25 min** |
| 1.3   | 2 min (test) | **20 min** |
| 1.4 (BOSS) | 2 min (test) | **10 min** |

---

## ✅ Verification Checklist

After applying changes, verify:

- [ ] SQL script executed without errors
- [ ] Phase durations updated (75 min for 1-4, 60 min for 5)
- [ ] Phase 5 has exactly 3 quests (check query above)
- [ ] Late window is 15 minutes (check query above)
- [ ] No Phase 5 boss exists (check query above)
- [ ] Build succeeds: `npm run build`
- [ ] Dev server starts: `npm run dev`
- [ ] Dashboard loads: http://localhost:3000

---

## 🔧 If Something Goes Wrong

### Issue: "Column late_submission_window_minutes doesn't exist"
**Solution:** Your database schema might be old. This column should exist.
```sql
-- Check if column exists
\d quests  -- Shows table structure
```

### Issue: "Phase 5 still shows 4 quests"
**Solution:** Query to delete unwanted boss quest:
```sql
DELETE FROM quests
WHERE phase_id = (SELECT id FROM phases WHERE order_index = 5)
  AND order_index = 4;
```

### Issue: "Late window didn't update"
**Solution:** Run this to fix:
```sql
UPDATE quests
SET late_submission_window_minutes = 15
WHERE phase_id IN (SELECT id FROM phases WHERE order_index BETWEEN 1 AND 5);
```

---

## 📝 Important Notes

### ⚠️ Before Applying Changes:
- Backup your current database (optional but recommended)
- Note current event status (paused? running? finished?)
- If event is running, this will immediately change phase timings

### 🔄 After Applying Changes:
- Rebuild: `npm run build`
- Restart server: `npm run dev`
- Test in control panel
- Clear browser cache (Ctrl+F5)

### 💡 These Changes Affect:
- ✅ All new submissions (will use 15 min late window)
- ✅ New event starts (will use 75 min phases)
- ⚠️ Running event: Might affect current late submissions
- ⚠️ If event is mid-phase: Won't retroactively change already-started phases

---

## 🎯 Expected Results After Update

### Database Level:
- ✅ Phase 1-4: 75 min each
- ✅ Phase 5: 60 min with 3 quests only
- ✅ All quests: 15 min late window
- ✅ Phase 5 max points: 300 (not 500)
- ✅ No boss in Phase 5

### Application Level:
- ✅ Control panel shows correct phase durations
- ✅ Timers count down for 75 minutes (Phases 1-4)
- ✅ Timers count down for 60 minutes (Phase 5)
- ✅ Late submission window extends 15 minutes after deadline
- ✅ Phase 5 shows only 3 quests (no boss)

### Event Level:
- ✅ Full event duration: ~330 minutes (5.5 hours)
- ✅ Evaluation period: 15 minutes after Phase 5.3 ends
- ✅ Game over sequence: Starts after evaluation period

---

## 📞 Files Reference

| File | Purpose |
|------|---------|
| [RESTORE_NORMAL_TIMINGS.sql](RESTORE_NORMAL_TIMINGS.sql) | ⚡ **MAIN FILE - Execute this** |
| [EVENT_TIMING_UPDATES_SUMMARY.md](EVENT_TIMING_UPDATES_SUMMARY.md) | 📋 Full documentation of changes |
| [CREATE_BOSS_QUESTS.sql](CREATE_BOSS_QUESTS.sql) | Updated (Phase 5 boss removed) |
| [MASTER_PLAN_FASE_5_RECONSTRUCAO.md](MASTER_PLAN_FASE_5_RECONSTRUCAO.md) | Updated (Phase 5 structure) |

---

## 🚀 Quick Start Command

To apply all changes in one command (after you're ready):

```bash
# 1. Copy RESTORE_NORMAL_TIMINGS.sql contents
# 2. Go to: https://app.supabase.com/project/YOUR_PROJECT/sql
# 3. Create new query
# 4. Paste entire file
# 5. Click RUN
# 6. Verify with queries above
# 7. Build & test locally
npm run build && npm run dev
```

---

## ✨ Summary

Your event has been updated from **quick test mode** to **normal production timings**:

- ✅ **Late Window**: 30 seconds → **15 minutes**
- ✅ **Phase Durations**: 6-8 min → **60-75 minutes**
- ✅ **Phase 5 Boss**: Removed (doesn't exist)
- ✅ **Total Event**: ~45 min → **~330 minutes (5.5 hours)**

**Next Action**: Execute [RESTORE_NORMAL_TIMINGS.sql](RESTORE_NORMAL_TIMINGS.sql) in Supabase SQL Editor

---

**Ready to apply? Open Supabase and execute the SQL! 🚀**
