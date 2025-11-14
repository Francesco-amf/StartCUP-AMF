# Late Submission Penalty System - Fixes Summary

## Problem Statement
Áurea Forma team submitted 2 quests late but the system was **not deducting the late submission penalties** from their final score.

### User's Explicit Statement
> "enviei a tarefa em atraso, o avaliador avaliou em 100 pontos, mas deveriam ser computados 95, porque aquele atraso previa -5 pontos, porém foram computados 100 pontos sem penalidade"

(I submitted the task late, the evaluator graded it 100 points, but it should have been computed as 95, because that late submission had a -5 point penalty, but it was computed as 100 without penalty)

## Root Cause

The `/api/evaluate/route.ts` endpoint was **not checking for or applying late submission penalties** when an evaluator assigned points to a submission.

### Workflow (Correct)
1. Team submits quest **late** (within 15-minute grace window)
2. System marks submission as `is_late = TRUE`
3. System calculates penalty: 0-5min = -5pts, 5-10min = -10pts, 10-15min = -15pts
4. System stores penalty in `late_penalty_applied` field
5. **[MISSING]** Evaluator reviews and assigns points (e.g., 100)
6. **[MISSING]** System should AUTOMATICALLY subtract penalty
7. **[MISSING]** Final score saved: 100 - 5 = 95

### What Was Broken
Step 6-7: The code was saving `final_points = avgPoints` without checking if the submission was late.

## Fix Applied

### File: `src/app/api/evaluate/route.ts` (Lines 191-219)

**Before:**
```typescript
// Atualizar submission com AMF Coins finais
const { error: updateError } = await supabase
  .from('submissions')
  .update({
    final_points: avgPoints,  // ❌ NO PENALTY DEDUCTION
    status: 'evaluated',
  })
```

**After:**
```typescript
// ========================================
// VERIFICAR SE É ATRASADA E SUBTRAIR PENALIDADE
// ========================================
let finalPoints = avgPoints

if (submission.is_late && submission.late_penalty_applied) {
  finalPoints = avgPoints - submission.late_penalty_applied
  console.log('⚠️  Late submission detected:', {
    avgPoints,
    late_penalty_applied: submission.late_penalty_applied,
    finalPoints
  })
}

// Atualizar submission com AMF Coins finais
const { error: updateError } = await supabase
  .from('submissions')
  .update({
    final_points: finalPoints,  // ✅ NOW DEDUCTS PENALTY
    status: 'evaluated',
  })
```

## How It Works Now

1. When evaluator assigns points, endpoint receives `base_points` and `multiplier`
2. Calculates average: `avgPoints = Math.round(totalPoints / evaluationsCount)`
3. **NEW**: Checks if `submission.is_late && submission.late_penalty_applied`
4. **NEW**: If yes, calculates: `finalPoints = avgPoints - submission.late_penalty_applied`
5. Saves `finalPoints` to database
6. Server logs show: `⚠️ Late submission detected: { avgPoints: 100, late_penalty_applied: 5, finalPoints: 95 }`

## Testing

### Automatic Testing
The endpoint automatically applies the penalty deduction whenever:
- A submission is marked as `is_late = TRUE`
- A submission has `late_penalty_applied > 0`
- An evaluator assigns points

### Manual Test Procedure
1. Create a test submission with:
   ```sql
   UPDATE submissions
   SET is_late = TRUE, late_penalty_applied = 5
   WHERE id = 'test-id';
   ```

2. Call the evaluate endpoint with base_points = 100
3. Check final_points in database: should be 95
4. Check server logs for: `⚠️ Late submission detected`

## Historical Data Correction

For Áurea Forma's existing submissions that were evaluated without penalties:

**File**: `CORRIGIR-TUDO-AGORA.sql`

This script:
1. Marks submissions as `is_late = TRUE`
2. Calculates `late_penalty_applied` based on actual time difference
3. Subtracts penalty from `final_points`
4. Updates `live_ranking` view

## Other Fixes

### Live Ranking View
**File**: `CORRIGIR-LIVE-RANKING-VIEW.sql`

Fixed Cartesian Product bug by using WITH subqueries instead of LEFT JOIN.

## Deployment Notes

1. ✅ Code changes committed: `Fix: Deduct late submission penalties automatically in evaluate endpoint`
2. ✅ Build verified: `npm run build` succeeds
3. ⏳ Deploy to production servers (ports 3000, 3001, 3002)
4. ⏳ Execute `CORRIGIR-TUDO-AGORA.sql` to fix historical data
5. ⏳ Test with live team submissions

## Verification Checklist

- [ ] Deploy code changes to all servers
- [ ] Execute `CORRIGIR-TUDO-AGORA.sql` on database
- [ ] Verify Áurea Forma's final score is corrected
- [ ] Test new late submissions to confirm penalty deduction
- [ ] Check server logs for penalty warning messages
- [ ] Verify live_ranking shows correct scores

## Code Quality

- ✅ Follows existing code patterns
- ✅ Includes detailed logging
- ✅ Handles edge cases (missing penalty fields)
- ✅ Type-safe TypeScript
- ✅ No breaking changes
- ✅ Build passes
