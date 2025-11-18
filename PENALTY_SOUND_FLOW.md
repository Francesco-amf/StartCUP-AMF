# Penalty Sound Flow Diagram

## Complete Flow from Penalty Application to Sound Playback

```
┌─────────────────────────────────────────────────────────────────────┐
│ Admin applies penalty in evaluator dashboard                        │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Penalty inserted into database (penalties table)                    │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Supabase emits postgres_changes event (Realtime)                    │
│ OR polling detects new penalty                                      │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │           │
                    ▼           ▼
           ┌──────────────┐  ┌──────────────┐
           │ Realtime     │  │ Polling      │
           │ Subscription │  │ Fallback     │
           └──────┬───────┘  └──────┬───────┘
                  │                  │
                  └─────────┬────────┘
                            │
                            ▼
     ┌──────────────────────────────────────────────────────┐
     │ useRealtimePenalties Realtime Callback Fired         │
     │ (Line 493 in useRealtime.ts)                         │
     │                                                       │
     │ Logs: 🔴 [useRealtimePenalties] REALTIME CALLBACK    │
     │       DISPARADO!                                    │
     └──────────────────┬───────────────────────────────────┘
                        │
                        ▼
     ┌──────────────────────────────────────────────────────┐
     │ Fetch all penalties from database                    │
     │ (Line 505-508 in useRealtime.ts)                     │
     └──────────────────┬───────────────────────────────────┘
                        │
                        ▼
     ┌──────────────────────────────────────────────────────┐
     │ Enrich penalties with team/evaluator names           │
     │ (Line 362-420 in useRealtime.ts)                     │
     └──────────────────┬───────────────────────────────────┘
                        │
                        ▼
     ┌──────────────────────────────────────────────────────┐
     │ Check if not first render                            │
     │ (Line 523: if (!isFirstRenderRef.current))           │
     └──────────────────┬───────────────────────────────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
         YES ▼                    ▼ NO
   ┌──────────────────┐   ┌────────────────────────┐
   │ Check if new     │   │ Skip sound playback    │
   │ penalty (not in  │   │ (first render)         │
   │ previousPenalty  │   │                        │
   │ IdsRef)          │   │ Logs: ⏳ Primeira      │
   └────────┬─────────┘   │ renderização           │
            │             └────────────────────────┘
            ▼
   ┌──────────────────┐
   │ If new penalty   │
   │ found            │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────────────────────────────────────────┐
   │ Check if page is visible                             │
   │ (Line 528: if (isPageVisibleRef.current))            │
   │                                                       │
   │ Logs: 🔍 Estado antes de detectar penalidades        │
   │       {                                              │
   │         isFirstRender: false,                        │
   │         pageVisible: true,                           │
   │         playFunctionAvailable: true                  │
   │       }                                              │
   └────────┬──────────────────────────────────────────────┘
            │
      ┌─────┴─────┐
      │           │
  YES ▼           ▼ NO
  ┌───────┐   ┌────────────────┐
  │ Call  │   │ Skip sound     │
  │ play()│   │ (bg tab)       │
  │       │   │                │
  │ Logs: │   │ Logs: 📵       │
  │ ✅    │   │ Página OCULTA  │
  │ play()│   └────────────────┘
  │ é     │
  │ função│
  └───┬───┘
      │
      ▼
   ┌──────────────────────────────────────────────────────┐
   │ useSoundSystem.play() called with 'penalty'          │
   │ (Line 533 in useRealtime.ts)                         │
   │                                                       │
   │ Logs: 📞 [useSoundSystem.play]                        │
   │       Config atual: { enabled: true, volume: 0.7 }   │
   │       📍 Call stack para play("penalty")              │
   └──────────────────┬───────────────────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────────────┐
   │ Check if audio is enabled                            │
   │ (Line 90: if (!soundConfig.enabled))                 │
   └──────────────────┬───────────────────────────────────┘
                      │
              ┌───────┴────────┐
              │                │
         YES ▼                 ▼ NO
  ┌───────────────────┐  ┌─────────────┐
  │ Proceed to play   │  │ Return      │
  │                   │  │ early (skip)│
  │ Logs:             │  │             │
  │ 🎵 Attempting to  │  │ Logs: 🔇    │
  │ play sound        │  │ Áudio       │
  └────────┬──────────┘  │ desabilitado│
           │             └─────────────┘
           ▼
   ┌──────────────────────────────────────────────────────┐
   │ Since type === 'penalty':                            │
   │ Call audioManager.playFile('penalty', priority)      │
   │ (Line 97 in useSoundSystem.ts)                       │
   │                                                       │
   │ With fallback: if file fails, play synthesized tone  │
   │ (Line 101-125)                                       │
   └──────────────────┬───────────────────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────────────┐
   │ AudioManager.playFile('penalty')                     │
   │ (Line 392 in audioManager.ts)                        │
   │                                                       │
   │ 1. Check if audio enabled                           │
   │ 2. Load audio file from cache or create new         │
   │ 3. Get file duration                                │
   │ 4. Enqueue sound with priority                      │
   │                                                       │
   │ Logs: 🎵 [playFile] Iniciando reprodução             │
   │       📀 Reproduzindo: penalty (...)                 │
   └──────────────────┬───────────────────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────────────┐
   │ enqueueSound() processes audio queue                 │
   │                                                       │
   │ - Priority-based ordering (penalty = priority 3)     │
   │ - Waits for previous sound to finish                 │
   │ - Manages GAP_BETWEEN_SOUNDS (800ms)                 │
   └──────────────────┬───────────────────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────────────┐
   │ Play audio.play()                                    │
   │ (Line 498 in audioManager.ts)                        │
   │                                                       │
   │ With retry logic:                                    │
   │ - 3 attempts with exponential backoff                │
   │ - Resume AudioContext if suspended                   │
   │ - Handle errors gracefully                          │
   │                                                       │
   │ Logs: ▶️ Tentativa 1/3 de tocar: penalty             │
   │       ✅ Som tocando com sucesso: penalty             │
   └──────────────────┬───────────────────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────────────┐
   │ 🔊 SOUND PLAYS! 🔊                                    │
   │                                                       │
   │ Audio file /sounds/penalty.mp3 is played              │
   │                                                       │
   │ Logs: ✅ Áudio terminado: penalty                     │
   └──────────────────────────────────────────────────────┘
```

## Where Sound Playback Can Fail

1. **Realtime doesn't connect** → Callback never fires → No logs
2. **Polling disabled** → Fallback never activates → No new penalties detected
3. **First render flag stuck** → isFirstRenderRef.current = true → Sound skipped
4. **Page hidden** → Tab in background → Sound intentionally skipped
5. **Audio disabled** → soundConfig.enabled = false → Sound skipped
6. **play() not function** → Type check fails → Sound not attempted
7. **Audio context suspended** → Browser policy → May retry
8. **Audio file not found** → 404 error → Fallback synthesized tone plays
9. **Audio file loading** → Duration NaN → Uses fallback duration
10. **Priority queue** → Waiting for other sounds → Sound delayed

## Expected Log Pattern

For a successful penalty sound:

```
🔴 [useRealtimePenalties] REALTIME CALLBACK DISPARADO!
📊 [useRealtimePenalties] Penalidades carregadas do banco: { total: 1, ids: ["..."] }
🔍 [useRealtimePenalties] Estado antes de detectar penalidades: { isFirstRender: false, pageVisible: true, playFunctionAvailable: true }
🎵 [useRealtimePenalties] NOVA PENALIDADE DETECTADA! ID: ..., Team: ...
✅ [useRealtimePenalties] play() é função, chamando play('penalty')
📞 [useSoundSystem.play] Chamado com tipo: "penalty", prioridade: undefined
   Config atual: { enabled: true, volume: 0.7 }
🎵 [useSoundSystem] Attempting to play sound: penalty
🎵 [playFile] Iniciando reprodução: "penalty" em "/sounds/penalty.mp3" (volume: 0.7)
📀 Reproduzindo: penalty (duração: 2500ms, prioridade: 3, readyState: 4)
▶️ Tentativa 1/3 de tocar: penalty
✅ Som tocando com sucesso: penalty
✅ Áudio terminado: penalty
```

If you see this entire sequence, the penalty sound will play!
