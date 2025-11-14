# 🎵 Testing Guide - Sound Playback Debug

**Build Status**: ✅ SUCCESS (4.5s)
**Date**: 2025-11-14
**Purpose**: Test sound playback on team dashboard with enhanced logging

---

## Quick Start

### Step 1: Ensure Server is Running
```bash
cd startcup-amf
PORT=3000 npm run dev
# Should start on http://localhost:3000
```

### Step 2: Open Two Browser Windows
- **Window 1**: Evaluator view (`http://localhost:3000/evaluate`)
- **Window 2**: Team dashboard (`http://localhost:3000/dashboard`)

### Step 3: Open Console in Both
- Press `F12` (or right-click → Inspect → Console)
- Keep both console windows visible side-by-side

---

## Test Scenario 1: NEW Evaluation

### Actions:
1. **In Evaluator window**:
   - Select a submission without evaluation
   - Click "⭐ Avaliar"
   - Fill in Base Points and Multiplier
   - Click "Enviar Avaliação"
   - Watch console for sounds logs

2. **In Team window**:
   - Keep watching the console
   - You should see logs appear within 2 seconds (next poll)

### Expected Console Logs (Team Window):

```
🎵 [TeamDashboardClient] Inicializando sound system...
🎵 [TeamDashboardClient] Configurando auto audio authorization...
🎵 [TeamDashboardClient] Sound system state: { enabled: true, volume: 0.7, ... }

(after 2 seconds, first poll)
📊 [TeamDashboardClient] Check: avaliadas=0, última=null, anterior=null, soundSystemReady=true

(when evaluation arrives)
📊 [TeamDashboardClient] Check: avaliadas=1, última=2025-11-14T21:XX:XX.XXZ, anterior=null, soundSystemReady=true
✅ [TeamDashboardClient] Detectada NOVA avaliação!

🔊 [TeamDashboardClient] Tocando: quest-complete para avaliação 1
🔊 [TeamDashboardClient] Sound state antes de play: { enabled: true, volume: 0.7, isPlaying: false, queueLength: 0, cachedAudios: 6 }
📞 [useSoundSystem.play] Chamado com tipo: quest-complete, prioridade: 0
🔊 [TeamDashboardClient] play() chamado com sucesso

(from audioManager)
📀 Reproduzindo: quest-complete (duração: 2500ms, prioridade: 1, readyState: 4)
🎵 Som adicionado à fila: quest-complete (prioridade: 1, fila agora tem 1 sons)
▶️ Tentativa 1/3 de tocar: quest-complete
✅ Som tocando com sucesso: quest-complete
✅ Áudio terminado: quest-complete

🔄 Recarregando página para mostrar submissões atualizadas...
```

### Sound Should:
- ✅ Play ~800ms after console shows "Detectada NOVA avaliação!"
- ✅ Last about 2-3 seconds
- ✅ Sound file: "quest-complete.mp3"

---

## Test Scenario 2: UPDATE Evaluation

### Actions:
1. **In Evaluator window**:
   - Select a submission WITH evaluation already done
   - Click "✏️ Editar"
   - Change Base Points (e.g., 38 → 40)
   - Click "Atualizar Avaliação"
   - Watch console

2. **In Team window**:
   - Watch console for NEW detection logs

### Expected Console Logs:
Same as Scenario 1, but:
```
✅ [TeamDashboardClient] Detectada EDIÇÃO DE avaliação!
```
Instead of:
```
✅ [TeamDashboardClient] Detectada NOVA avaliação!
```

The rest should be identical!

---

## Debugging Checklist

### If No Logs at All:
- [ ] Check if console is showing? (Should show 🎵 initialization messages)
- [ ] Is TeamDashboardClient being rendered? (Check page source)
- [ ] Is React client component enabled? (Check for 'use client' directive)

### If Initialization Logs Appear But Polling Doesn't:
- [ ] Is pollInterval starting? (Should see 📊 every 2 seconds)
- [ ] Is API responding? (Check Network tab, `/api/team/check-updates`)
- [ ] Is API returning correct data structure?

### If Detection Logs Appear But Sound Doesn't Play:
- [ ] Is `🔊 [TeamDashboardClient] play() chamado com sucesso` appearing?
- [ ] Is `📞 [useSoundSystem.play]` log appearing?
- [ ] What does "Sound state antes de play" show?
  - If `enabled: false` → Audio disabled
  - If `volume: 0` → Volume is muted
  - If something else → Check specific issue

### If Sound Logs Appear But No Audio Heard:
- [ ] Check browser volume settings
- [ ] Check system volume settings
- [ ] Try opening `/sounds-test` page (if exists) to test audio system
- [ ] Check if `/sounds/quest-complete.mp3` file exists
- [ ] Check browser console for any error messages (red text)

---

## File Paths to Verify

The sound file should be at:
```
public/sounds/quest-complete.mp3
```

Verify it exists:
```bash
ls -la public/sounds/quest-complete.mp3
```

If missing, the file needs to be added to the project.

---

## Network Request Check

1. Open **Network** tab in DevTools
2. Filter for `/api/team/check-updates`
3. When evaluation is submitted:
   - Should see new request
   - Response should include:
   ```json
   {
     "snapshot": "...",
     "data": {
       "evaluatedCount": 1,
       "lastEvaluatedTime": "2025-11-14T21:XX:XX.XXZ",
       "..."
     }
   }
   ```

---

## Critical Files Modified

| File | Purpose |
|------|---------|
| [TeamDashboardClient.tsx](src/components/TeamDashboardClient.tsx) | Main polling + sound logic |
| [useSoundSystem.ts](src/lib/hooks/useSoundSystem.ts) | Sound hook with logging |
| [audioManager.ts](src/lib/audio/audioManager.ts) | Audio playback manager |
| [audioContext.ts](src/lib/audio/audioContext.ts) | AudioContext initialization |

---

## What to Report Back

When testing, please report:

### If Sound Plays (Success! 🎉)
- Console screenshot showing all logs
- Time from "Detectada" to audio heard
- Worked for NEW? Worked for UPDATE?

### If Sound Doesn't Play (Debug Info Needed)
- **Full console output** (copy all relevant logs)
- **Network response** from `/api/team/check-updates`
- **Which logs appear** and which don't (use checklist above)
- **Sound state output** (enabled, volume, etc.)
- **Browser and OS** (Chrome, Firefox, Windows, Mac, etc.)
- **Browser volume** (is it muted?)

---

## Troubleshooting Flowchart

```
START
  ↓
Is sound playing?
  ├─ YES → 🎉 SUCCESS! Report it worked
  └─ NO → Continue
       ↓
       Are any console logs showing?
       ├─ NO → Check if page is loaded, F12 is open, TeamDashboardClient is rendered
       └─ YES → Continue
               ↓
               Do you see "Detectada NOVA/EDIÇÃO DE avaliação!" logs?
               ├─ NO → API not returning evaluatedCount correctly
               │       Check /api/team/check-updates response
               └─ YES → Continue
                       ↓
                       Do you see "play() chamado com sucesso"?
                       ├─ NO → play() function not being called
                       │       Check if setTimeout is executing
                       └─ YES → Continue
                               ↓
                               What does "Sound state antes de play" show?
                               ├─ enabled: false → Audio disabled, needs authorization
                               ├─ volume: 0 → Volume is 0, check slider
                               └─ Other → File might be missing/404
                                         Check if quest-complete.mp3 exists
```

---

## Quick Commands

### Check if sound file exists:
```bash
test -f "c:\Users\symbi\Desktop\startcup-amf\startcup-amf\public\sounds\quest-complete.mp3" && echo "File exists" || echo "File not found"
```

### Rebuild and restart:
```bash
npm run build && npm run dev
```

### Check TypeScript errors:
```bash
npx tsc --noEmit
```

---

**Ready to test!** 🚀

Open both windows, submit an evaluation, and watch the console!
