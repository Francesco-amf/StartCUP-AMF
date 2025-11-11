# ⚡ Quick Test Guide - v2.7

**Just apply penalties and check sounds!**

---

## 🚀 Start Here

### Terminal
```bash
npm run dev
# Wait for: ▲ Next.js 16.0.1 - Local: http://localhost:3000
```

### Browser - Open Two Tabs
**Tab 1:** http://localhost:3000/live-dashboard
**Tab 2:** http://localhost:3000/control-panel

### Both Tabs - Open Console
**Tab 1:** Press F12 → Console tab
**Tab 2:** Press F12 → Console tab

---

## ✅ Test 1: Authorize Audio (30 seconds)

### Tab 1
1. Click anywhere on the page
2. Look at console for: `✅ Áudio autorizado automaticamente`
3. Look at banner: Should be green

**Result:** ✅ or ❌ ?

---

## ✅ Test 2: Apply One Penalty (1 minute)

### Tab 2
1. Select a team from dropdown (e.g., "Equipe A")
2. Select penalty type
3. Click "Aplicar Penalidade"

### Tab 1 - Listen & Watch Console
1. **You should HEAR:** Penalty buzzer sound 🔊 for ~400ms
2. **Console should show:**
   ```
   ✨ PENALIDADE NOVA ENCONTRADA
   🔊🔊🔊 PENALIDADE NOVA DETECTADA
   📈 [RankingBoard #1] Time subiu no ranking
   ```
3. **You should HEAR:** Ranking-up sound 🎵 after penalty

**Questions:**
- Did you hear the penalty buzzer? ✅ or ❌
- Did you hear ranking-up sound? ✅ or ❌
- Did ranking-up sound play only ONCE? ✅ or ❌

---

## ✅ Test 3: Apply Multiple Penalties (2 minutes)

### Tab 2
1. Select Team A → Apply penalty
2. (Wait 2 seconds)
3. Select Team B → Apply penalty
4. (Wait 2 seconds)
5. Select Team C → Apply penalty

### Tab 1 - Listen & Count

**Count the "ranking-up" sounds you hear:**
- Should be approximately 3 (one per team)
- NOT 6, 9, or more (would indicate duplicates)

**Console check - Look for:**
```
📈 [RankingBoard #1] Time subiu no ranking: Equipe A
📈 [RankingBoard #1] Time subiu no ranking: Equipe B
📈 [RankingBoard #1] Time subiu no ranking: Equipe C
```

All should show `#1` (NOT `#2` or `#3`)

**Questions:**
- How many ranking-up sounds did you hear? ___
- Did you see any `#2` or higher in console? ✅ or ❌

---

## 📝 Report Template

Copy this and fill in:

```
TEST RESULTS - v2.7

Test 1 - Audio Authorization:
✅ Audio authorized? YES / NO
✅ Green banner appeared? YES / NO

Test 2 - Single Penalty:
✅ Heard penalty buzzer? YES / NO
✅ Heard ranking-up? YES / NO
✅ Played only once? YES / NO

Test 3 - Multiple Penalties:
How many ranking-up sounds? ___
Saw [RankingBoard #1] for all? YES / NO
Saw [RankingBoard #2] or higher? YES / NO

Additional notes:
[any other observations]
```

---

## 🎯 Success = All ✅

If all tests show ✅ and you answer correctly, **the audio system is FIXED!**

```
Penalty sounds: ✅
Ranking sounds: ✅
No duplicates: ✅
Correct order: ✅

SYSTEM READY FOR PRODUCTION ✅
```

---

## 🚨 If Something's Wrong

### Penalty doesn't play
- Penalty buzzer never heard?
- Check: Is there `✨ PENALIDADE NOVA ENCONTRADA` in console?
  - If YES → Detected but not playing (audio system issue)
  - If NO → Not being detected (database/polling issue)

### Ranking sound plays multiple times
- Heard ranking-up sound 2+ times for 1 penalty?
- Check: Do you see `[RankingBoard #2]` in console?
  - If YES → RankingBoard processing triggered twice
  - If NO → Something else is wrong

### No sound at all
- Check: Green banner appeared after clicking?
  - If NO → Audio not authorized (click page first)
  - If YES → File not found or Web Audio API issue

---

## 💡 Quick Troubleshooting

**"No sounds at all"**
→ Did you click the page first? (to authorize audio)

**"Penalty buzzer but no ranking sound"**
→ Check if ranking actually changed (scores updated?)

**"Ranking sound plays 2-3 times"**
→ This is the issue we're testing for. Report it!

**"Penalty sound plays multiple times"**
→ That shouldn't happen (penalty is in queue, not repeated)

---

**Just test and report! 🎵**
