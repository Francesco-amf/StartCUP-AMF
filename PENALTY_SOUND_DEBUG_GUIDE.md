# Penalty Sound Debugging Guide

## Overview
Enhanced logging has been added to diagnose why penalty sounds aren't playing in the live dashboard.

## What To Look For in Console

### 1. Realtime Subscription Status
```
📡 [useRealtimePenalties.subscribe] Status: SUBSCRIBED
```
- **SUBSCRIBED** = Realtime WebSocket is working
- Any other status = Realtime not connected, will use polling fallback

### 2. Penalty Detection Flow
When a penalty is applied, you should see this sequence:

```
🔴 [useRealtimePenalties] REALTIME CALLBACK DISPARADO!
  {
    eventType: "INSERT",
    newData: { ... penalty data ... }
  }

📊 [useRealtimePenalties] Penalidades carregadas do banco:
  {
    total: 1,
    ids: ["penalty-id-123"]
  }

🔍 [useRealtimePenalties] Estado antes de detectar penalidades:
  {
    isFirstRender: false,
    pageVisible: true,
    playFunctionAvailable: true
  }

🎵 [useRealtimePenalties] NOVA PENALIDADE DETECTADA!
  ID: penalty-id-123, Team: Team Name
```

### 3. Sound Playback
```
✅ [useRealtimePenalties] play() é função, chamando play('penalty')

📞 [useSoundSystem.play] Chamado com tipo: "penalty", prioridade: undefined
   Config atual: { enabled: true, volume: 0.7 }

📍 Call stack para play("penalty")
  [shows full call stack]

🎵 [useSoundSystem] Attempting to play sound: penalty
```

### 4. Audio File Playing
```
🎵 [playFile] Iniciando reprodução: "penalty" em "/sounds/penalty.mp3"

📀 Reproduzindo: penalty (duração: 2500ms, prioridade: 3, readyState: 4)

▶️ Tentativa 1/3 de tocar: penalty
✅ Som tocando com sucesso: penalty

✅ Áudio terminado: penalty
```

## Troubleshooting Steps

### If No Penalty Detected Logs
**Problem**: The Realtime callback is never firing
1. Check if Realtime subscription shows "SUBSCRIBED"
2. Check browser Network tab - look for WebSocket connection
3. Check if polling fallback is being used instead

### If "isFirstRender: true"
**Problem**: `isFirstRenderRef` is still true, blocking sound playback
1. This should never happen after initial load
2. Check if initial penalties were loaded: `✅ [useRealtimePenalties] Primeira renderização completa!`
3. If missing, initial load may have failed

### If "pageVisible: false"
**Problem**: The tab is hidden when penalty arrives
1. Sound won't play to avoid unwanted audio in background tabs
2. Switch to the live dashboard tab before applying penalty
3. Or check: are sounds disabled? (Audio not authorized in browser)

### If "playFunctionAvailable: false"
**Problem**: play() function is not available
1. useSoundSystem hook may not have loaded
2. Check if there are errors in the console above
3. Refresh the page

### If "soundConfig.enabled: false"
**Problem**: Audio is disabled in the UI
1. Click the "🔊 Ativar" button in the AudioAuthorizationBanner
2. Or click the toggle button in SoundControlPanel

### If Sound Plays But Fails
```
❌ Erro durante attemptPlay para penalty: NotAllowedError
```
1. Audio context may not be authorized
2. Make sure to click somewhere on the page before applying penalty
3. Check browser console for permission errors

## How to Test

1. Open live dashboard in browser
2. Open Developer Tools → Console tab
3. Make sure AudioAuthorizationBanner shows "✅ Áudio autorizado"
4. Apply a penalty (via admin or evaluator)
5. Watch console for logs above
6. If no sound plays, the console logs will tell you exactly why

## Key Files Modified

- `src/lib/hooks/useRealtime.ts` - Added penalty detection logging
- `src/lib/hooks/useSoundSystem.ts` - Added play() function logging and call stack trace
- `src/lib/audio/audioManager.ts` - Already has comprehensive error logging

## Recent Commits

- `7d8e986` - Debug: Add detailed call stack and state logging for penalty sound playback
- `3220fc8` - Debug: Add comprehensive subscription status logging to diagnose Realtime connection
