# ⚡ Quick Test - v2.9

**Just 2 minutes to verify everything works!**

---

## 🚀 Setup

```bash
npm run dev
# Wait for: ▲ Next.js 16.0.1 - Local: http://localhost:3000
```

**Open two browser tabs:**
- **Tab 1:** http://localhost:3000/live-dashboard
- **Tab 2:** http://localhost:3000/control-panel

**Open console on both tabs:** Press F12

---

## ✅ Test 1: Authorize Audio (30 seconds)

### Tab 1
1. **Click anywhere** on the page
2. Look for console message: `✅ Áudio autorizado`
3. Banner should turn green

**Result:** ✅ or ❌

---

## ✅ Test 2: Apply Penalty & Hear Sounds (1 minute)

### Tab 2
1. Select a team (e.g., "Equipe A")
2. Select penalty type
3. Click "Aplicar Penalidade"

### Tab 1 - LISTEN CAREFULLY

**Order you should hear:**
1. 🔊 **FIRST:** Penalty buzzer (~400ms) - sharp buzzer sound
2. ⏳ **THEN:** Silence (~800ms) - quiet gap
3. 🎵 **THEN:** Ranking-up sound (~150ms) - melodic beep

**Timeline:** Total ~1.35 seconds

### Tab 1 - CHECK CONSOLE

Look for these messages **IN THIS ORDER:**
```
🔊🔊🔊 PENALIDADE NOVA DETECTADA: Equipe A
🔔 [RankingBoard.useEffect] Ranking mudou, aguardando 500ms
⏰ [RankingBoard] Delay de 500ms expirou, processando agora...
📈 [RankingBoard #1] Time subiu no ranking: Equipe A
```

**Results:**
- Heard penalty buzzer first? ✅ or ❌
- Heard ranking-up after? ✅ or ❌
- Console shows 500ms delay message? ✅ or ❌
- No errors (red text)? ✅ or ❌

---

## ✅ Test 3: Multiple Penalties (30 seconds)

### Tab 2
1. Apply penalty to Team A
2. (wait 1 second)
3. Apply penalty to Team B
4. (wait 1 second)
5. Apply penalty to Team C

### Tab 1 - LISTEN

Should hear:
1. Penalty 1 + Ranking-up 1
2. Penalty 2 + Ranking-up 2
3. Penalty 3 + Ranking-up 3

**Count:** How many penalty sounds? **Should be 3**

### Tab 1 - CHECK CONSOLE

Count `📈 [RankingBoard #1]` messages (should have `#1`, not `#2` or `#3`)

**Result:** Saw `#1` three times? ✅ or ❌

---

## 📋 Summary

Copy this and tell me:

```
✅ Audio authorized successfully? YES / NO

✅ Penalty sound played? YES / NO

✅ Ranking-up sound played? YES / NO

✅ Correct order (penalty BEFORE ranking)? YES / NO

✅ No duplicate sounds? YES / NO

✅ Console shows 500ms delay message? YES / NO

How many penalty sounds heard when applying 3 penalties? ___
```

---

## 🎯 Perfect Result

If you answered **YES to all and heard 3 sounds**, the audio system is **FIXED AND READY!** 🎉

---

```
v2.9: 500ms Delay Timing
Status: READY FOR TESTING

Test now! 🔊🎵
```
