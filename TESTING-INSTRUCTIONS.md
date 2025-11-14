# Testing Instructions - Evaluation Refresh Fix

## Quick Test (2-3 minutes)

### Step 1: Open Browser Console
1. Open http://localhost:3000 in Chrome/Firefox/Edge
2. Press F12 to open Developer Tools
3. Go to **Console** tab
4. Keep this open during testing

### Step 2: Navigate to Evaluator Page
1. Go to `/evaluate` (or `/dashboard` if you have evaluator access)
2. You should see "Bem-vindo, [Evaluator Name]"
3. You should see list of "Entregas para Avaliar" (Submissions to Evaluate)

### Step 3: Submit an Evaluation
1. Click "⭐ Avaliar" on any submission
2. You're now on `/evaluate/[submissionId]`
3. Fill the form:
   - **AMF Coins Base**: 50
   - **Multiplicador**: 1.5
   - **Comentários**: Test evaluation (optional)
4. Click **"Enviar Avaliação"** button

### Step 4: Verify Results
Watch for these signs of success:

```
✅ PASS if you see:
1. Console shows: "✅ [EvaluationForm] Avaliação enviada"
2. Console shows: "✅ Avaliação salva: {success: true...}"
3. Form fields clear (inputs reset)
4. Submit button becomes clickable again
5. Quest-complete sound plays
6. NO page refresh (no flicker/reload)
7. You stay on the evaluation page
8. Can submit another evaluation immediately

❌ FAIL if you see:
1. Page reloads/flickers
2. Browser URL changes
3. "Enviando..." button never finishes
4. Console shows network error
5. Sound is interrupted/distorted
```

---

## Detailed Test Scenarios

### Scenario 1: New Evaluation
**Purpose**: Test submitting evaluation for first time

**Steps**:
1. Go to `/evaluate`
2. Find submission with "Pendentes" counter > 0
3. Click "⭐ Avaliar"
4. Fill form:
   - Base: 100
   - Multiplier: 1.0
   - Comment: "First evaluation test"
5. Click "Enviar Avaliação"

**Expected Result**:
- Form resets
- Sound plays
- No page refresh
- Status shows "Já Avaliadas" count increased

---

### Scenario 2: Update Evaluation
**Purpose**: Test re-evaluating same submission

**Steps**:
1. Go to `/evaluate`
2. In "Minhas Avaliações" section, click "✏️ Editar"
3. Form should show previous values
4. Change values:
   - Base: 75
   - Multiplier: 2.0
5. Click "Atualizar Avaliação"

**Expected Result**:
- Form resets
- Sound plays
- No page refresh
- New values saved

---

### Scenario 3: Rapid Multiple Submissions
**Purpose**: Test form reusability

**Steps**:
1. Go to `/evaluate`
2. Click "⭐ Avaliar" on first submission
3. Fill and submit (Base: 50, Multiplier: 1.0)
4. **Immediately** click back button
5. Select different submission
6. Fill and submit (Base: 80, Multiplier: 1.5)
7. Repeat 2-3 more times

**Expected Result**:
- Each submission completes without error
- Form always resets properly
- No accumulation of state
- All sounds play

---

### Scenario 4: Network Error Recovery
**Purpose**: Test graceful error handling

**Steps**:
1. Open DevTools (F12 → Network tab)
2. Go to `/evaluate` and select submission
3. Filter network to only `/api/` calls
4. Fill form
5. **Before clicking submit**: Throttle network (right-click → Edit as cURL, change to offline)
6. Click "Enviar Avaliação"
7. See error appear
8. Restore network
9. Try again

**Expected Result**:
- Error message shown: "❌ Erro ao enviar avaliação"
- Form is not reset (keeps user's data)
- Submit button is re-enabled
- Can try again when network restored

---

## Verification Checklist

### Immediate After Submit:
- [ ] Form inputs are cleared (base_points reset to 0, multiplier to 1.0)
- [ ] "⏳ Enviando..." button changes back to clickable "Enviar Avaliação"
- [ ] No console errors (red X)
- [ ] Browser tab does NOT reload (no flicker)
- [ ] URL stays `/evaluate/[submissionId]`
- [ ] Sound plays without interruption

### Live Data Update (within 500ms):
- [ ] Go to `/dashboard` or another page
- [ ] Check team rankings
- [ ] Verify the evaluated team's score increased
- [ ] No full page reload happened

### Edge Cases:
- [ ] Can submit twice in quick succession
- [ ] Can update previous evaluation without issues
- [ ] Error messages show properly if network fails
- [ ] No console errors or TypeScript warnings
- [ ] Mobile/tablet responsive behavior works

---

## Server Logs to Watch

In terminal where `npm run dev` is running, look for:

```
✅ Signs of Success:
[EvaluationForm] Avaliação enviada
Evaluation result: { evaluation, evalError }
Updated submission: { avgPoints, finalPoints, ... }

❌ Signs of Problems:
Erro ao salvar avaliação
❌ Error updating submission
ReferenceError: finalPoints is not defined
```

---

## Browser Console Debugging

### Enable console logging:
1. Press F12
2. Go to Console tab
3. Type: `localStorage.setItem('DEBUG', 'true')`
4. Refresh page

### Expected console output:
```javascript
// Before submit
[EvaluationForm] Form submitted

// During submit
📦 Submission lookup: {...}
Received evaluation data: {...}
💾 Upsert result: {...}

// After submit
✅ [EvaluationForm] Avaliação enviada
✅ Avaliação salva: {success: true, ...}

// Polling detects change
🔔 [RankingBoard.useEffect] Ranking mudou, processando imediatamente

// Live update happens
✅ Ranking updated in real-time
```

---

## Network Tab Analysis

### Expected Network Activity:

1. **POST /api/evaluate** (when you click submit)
   - Method: POST
   - Status: 200
   - Response: `{"success": true, "final_points": ...}`
   - Size: ~200 bytes
   - Time: 50-200ms

2. **GET /api/* polling** (background)
   - Multiple requests to `/api/evaluate/status` or similar
   - Status: 200
   - Time: 500ms intervals
   - These are *not* from your submit, just normal polling

3. **NO full page request**
   - Should see NO request to `/evaluate` page itself
   - Should see NO HTML response (that would indicate reload)

---

## Success Criteria

✅ **PASS** if:
1. Evaluation form submits and returns
2. Form resets immediately
3. Sound plays uninterrupted
4. No page reload/flicker
5. Live dashboard updates within 500ms
6. Can submit another evaluation without issues
7. All console logs show success messages
8. Network shows JSON response, not page reload

❌ **FAIL** if:
1. Page reloads after submit
2. Form doesn't reset
3. Sound is interrupted or missing
4. Takes more than 1 second for UI to respond
5. Console shows errors
6. Network shows page reload (HTML response)

---

## If Tests Fail

### Problem: "Page reloads after submit"
**Debug**:
1. Check Network tab → see if page HTML is fetched
2. Check if `window.location.href` is being called
3. Check `/api/evaluate/route.ts` line 222
4. Verify build includes latest code: `npm run build`

### Problem: "Form doesn't reset"
**Debug**:
1. Check console for errors
2. Check if response is valid JSON
3. Verify `form.reset()` is being called
4. Check if response.ok is true

### Problem: "Sound doesn't play"
**Debug**:
1. Check browser sound settings
2. Test sounds at `/sounds-test` page
3. Check console: should see `queuing quest-complete`
4. Check if sound system initialized

### Problem: "Live data doesn't update"
**Debug**:
1. Check if polling hooks are running
2. Go to `/dashboard` and check rankings there
3. Manually refresh page to see if data is actually updated
4. Check Supabase: verify submission.final_points changed

---

## Quick Smoke Test Script

Run this in browser console:

```javascript
// Check if services are initialized
console.log('SoundSystem ready:', window.__soundSystem !== undefined)
console.log('Page visible:', !document.hidden)
console.log('Polling active:', setInterval !== undefined)

// Check evaluate endpoint
fetch('/api/evaluate', {
  method: 'POST',
  body: new FormData([
    ['submission_id', 'test'],
    ['evaluator_id', 'test'],
    ['base_points', '50']
  ])
}).then(r => r.json()).then(d => {
  console.log('API Response:', d)
  console.log('✅ Endpoint working') if (d.success)
})
```

---

## Performance Metrics to Check

After evaluation submit:

```
Time from submit to:
- Form reset: ~0ms (immediate)
- Sound plays: ~0ms (immediate)
- Network response: 50-200ms
- Polling detects change: 0-500ms
- Live UI updates: 500-700ms (within first poll)

Total user experience time: ~100ms to see success
```

---

## Database Verification

After testing, verify data in Supabase:

1. Go to Supabase Dashboard
2. Check `evaluations` table
   - New row should exist
   - `points`, `base_points`, `multiplier` should match form values
3. Check `submissions` table
   - `final_points` should be calculated
   - `status` should be 'evaluated'
   - `is_late` and `late_penalty_applied` should be considered

---

## Cleanup After Testing

Clear test data:
```sql
-- See what was created
SELECT * FROM evaluations
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;

-- Optional: Delete test evaluations
DELETE FROM evaluations
WHERE created_at > now() - interval '1 hour'
AND comments LIKE '%test%';
```

---

## Reporting Issues

If tests fail, provide:
1. Browser console output (screenshot)
2. Network tab (screenshot)
3. Server logs (last 50 lines)
4. Steps to reproduce
5. Expected vs actual behavior
6. Browser type and version

