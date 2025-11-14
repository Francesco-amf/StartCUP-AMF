# 🏗️ Arquitetura Completa do Sistema de Áudio

**Data:** 2025-11-12
**Status:** Documentação Técnica Completa

---

## 📊 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIVE DASHBOARD (Client)                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                   CurrentQuestTimer.tsx
         (useEffect: qua mudar de quest)
                              ↓
        ┌──────────────────────────────────┐
        │  Detectar som apropriado para:   │
        │  1. event-start (Fase 1 Quest 1) │
        │  2. quest-start (quest normal)   │
        │  3. boss-spawn (quest 4)         │
        │  4. phase-start (mudança fase)   │
        └──────────────────────────────────┘
                              ↓
                   play('event-start')
                              ↓
         useSoundSystem Hook (src/lib/hooks/useSoundSystem.ts)
                              ↓
                   audioManager.playFile()
                              ↓
         audioManager.enqueueSound() - Adiciona à fila com prioridade
                              ↓
         audioManager.processQueue() - Processa sons na ordem
                              ↓
         Audio.play() - Reproduz arquivo MP3/WAV
                              ↓
                         🔊 SOUND PLAYS
```

---

## 📂 Arquivos Envolvidos

### 1. **CurrentQuestTimer.tsx** (Componente UI)
**Localização:** `src/components/dashboard/CurrentQuestTimer.tsx`

**Responsabilidade:**
- Monitorar quests via polling (500ms ou 5s)
- Detectar mudanças de quest
- Chamar `play()` com o tipo de som apropriado

**Chave Points:**
- Linha 286: `const { play } = useSoundSystem()`
- Linhas 475-522: useEffect que detecta mudanças e toca sons
- Linha 489: Detecta `phaseChanged`
- Linhas 491-514: Lógica condicional para escolher som

---

### 2. **useSoundSystem.ts** (Hook)
**Localização:** `src/lib/hooks/useSoundSystem.ts`

**Responsabilidade:**
- Fornecer função `play()` para componentes
- Gerenciar estado de configuração (`enabled`, `volume`)
- Sincronizar com localStorage

**Função Principal:**
```typescript
const play = (type: AudioFileType, priority?: number) => {
  console.log('📞 [useSoundSystem.play] Chamado com tipo:', type)
  playFile(type, priority)
}

const playFile = (type: AudioFileType, priority?: number) => {
  audioManager.playFile(type, priority).catch(err => {
    console.error(`❌ Erro ao reproduzir arquivo: ${type}`, err)
  })
}
```

**Fluxo:**
1. useEffect inicializa `isClient = true`
2. `play()` chama `audioManager.playFile()`
3. Erros são capturados e logados

---

### 3. **audioManager.ts** (Gerenciador Central)
**Localização:** `src/lib/audio/audioManager.ts`

**Responsabilidade:**
- Gerenciar fila de sons com prioridades
- Controlar carregamento de arquivos de áudio
- Reproduzir sons em sequência
- Aplicar filtros (e.g., remover quest-start quando phase-start toca)

**Componentes Principais:**

#### a) **Inicialização (Singleton)**
```typescript
private constructor() {
  if (typeof window !== 'undefined') {
    this.isClient = true
    this.loadConfigFromStorage()
    this.setupStorageListener()
    this.setupInteractionListener()
    this.initMasterGain()
    this.preloadCriticalAudios()  // ← Pré-carrega event-start, phase-start, penalty
    setupAutoAudioAuthorization() // ← Browser autoplay policy
  }
}
```

#### b) **Mapeamento de Arquivos**
```typescript
const AUDIO_FILES: Record<AudioFileType, string> = {
  'event-start': '/sounds/event-start.mp3',
  'quest-start': '/sounds/quest-start.mp3',
  'boss-spawn': '/sounds/boss-spawn.wav',
  'phase-start': '/sounds/phase-start.mp3',
  // ... etc
}
```

#### c) **Prioridades**
```typescript
const AUDIO_PRIORITIES: Record<AudioFileType, number> = {
  'event-start': 0,    // ← MÁXIMA
  'phase-start': 0,    // ← MÁXIMA
  'boss-spawn': 2,     // ← ALTA
  'quest-start': 5,    // ← MÉDIA-BAIXA (pode ser removida)
}
```

#### d) **Método playFile()**
```typescript
async playFile(type: AudioFileType, priority?: number): Promise<void> {
  if (!this.config.enabled) return  // ← Se desabilitado, não toca

  // 1. Obter arquivo do mapa
  const filePath = AUDIO_FILES[type]

  // 2. Carregar ou usar cache
  let audio = this.audioCache.get(type)
  if (!audio) {
    audio = new Audio(filePath)
    this.audioCache.set(type, audio)
  }

  // 3. Aplicar volume (geral × específico)
  audio.volume = this.config.volume * AUDIO_VOLUMES[type]

  // 4. Adicionar à fila
  await this.enqueueSound({
    type: 'file',
    id: type,
    duration: audio.duration * 1000,
    priority: priority ?? AUDIO_PRIORITIES[type],
    timestamp: Date.now(),
    callback: async () => {
      // Tocar arquivo
      await audio.play()
      // Esperar conclusão
      await new Promise(resolve => {
        audio.addEventListener('ended', resolve, { once: true })
      })
    }
  })
}
```

#### e) **Método enqueueSound()**
```typescript
private async enqueueSound(sound: QueuedSound): Promise<void> {
  // 🎯 FILTRO: Se é transição, remover quest-start
  if (sound.id === 'phase-start' || sound.id === 'event-start') {
    this.soundQueue = this.soundQueue.filter(s => s.id !== 'quest-start')
    console.log(`🔥 Som de transição detectado! Removidas X instâncias de quest-start`)
  }

  // Adicionar à fila
  this.soundQueue.push(sound)

  // Ordenar por prioridade
  this.soundQueue.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return a.timestamp - b.timestamp
  })

  console.log(`🎵 Som adicionado à fila: ${sound.id}`)

  // Se não está tocando, começar
  if (!this.isPlaying) {
    this.processQueue()
  }
}
```

#### f) **Método processQueue()**
```typescript
private async processQueue(): Promise<void> {
  if (this.isPlaying || this.soundQueue.length === 0) return

  this.isPlaying = true

  while (this.soundQueue.length > 0) {
    const sound = this.soundQueue.shift()

    try {
      // Aguardar intervalo entre sons (800ms)
      const gap = this.GAP_BETWEEN_SOUNDS
      await sleep(gap)

      // Executar callback (que toca o arquivo)
      await sound.callback()

      this.lastPlayTime = Date.now()
    } catch (error) {
      console.error(`❌ Erro ao processar som`, error)
    }
  }

  this.isPlaying = false
}
```

---

### 4. **audioContext.ts** (Web Audio API)
**Localização:** `src/lib/audio/audioContext.ts`

**Responsabilidade:**
- Gerenciar AudioContext compartilhado
- Retomar AudioContext suspenso
- Autorizar áudio via browser interop

**Função Principal:**
```typescript
export function setupAutoAudioAuthorization(): void {
  const handleInteraction = () => {
    isAudioAuthorized = true

    // Retomar AudioContext se suspenso
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    console.log('✅ Áudio autorizado após interação')
  }

  // Listeners para: click, touchstart, keydown
  window.addEventListener('click', handleInteraction, { once: true })
  window.addEventListener('touchstart', handleInteraction, { once: true })
  window.addEventListener('keydown', handleInteraction, { once: true })
}
```

---

### 5. **AudioAuthorizationBanner.tsx** (UI Banner)
**Localização:** `src/components/dashboard/AudioAuthorizationBanner.tsx`

**Responsabilidade:**
- Mostrar status de autorização de áudio
- Indicar que usuário deve clicar para autorizar

**Visual:**
```
Antes de autorizar:  🔇 ⚠️ Para ouvir sons, clique em qualquer lugar
Depois de autorizar: 🔊 ✅ Áudio autorizado - Sons estão ativos!
```

---

## 🔄 Fluxo Completo Passo-a-Passo

### Cenário: Fase 1 Quest 1 Inicia (event-start deve tocar)

```
[T=0:00] Você clica "Start Phase" no Control Panel
          ↓
[T=0:00] advance-quest API é chamada
          ↓
[T=0:01] BroadcastChannel envia 'questAdvanced' para CurrentQuestTimer
          ↓
[T=0:01] CurrentQuestTimer.fetchQuests() é disparado
          ↓
[T=0:01] SELECT * FROM quests WHERE phase_id = 1 ORDER BY order_index
          ↓
[T=0:01] currentQuest = Quest com order_index = 1, started_at = now
          ↓
[T=0:01] previousQuestIdRef.current = null (primeira ativação)
         isFirstActivation = true (quest começou há < 5s)
         isQuestChange = false (pois previousQuestIdRef era null)
          ↓
[T=0:02] Entra em: if (isQuestChange || isFirstActivation)
          ↓
[T=0:02] isFirstQuestOfPhase1 = (phase === 1 && order_index === 1) = true
          ↓
[T=0:02] play('event-start') ← CHAMADO!
         console.log('🎬 INÍCIO DO EVENTO!')
         console.log('🔊 Tocando som: event-start')
          ↓
[T=0:02] useSoundSystem.play('event-start')
         console.log('📞 [useSoundSystem.play] ... event-start ... isClient: true')
          ↓
[T=0:02] audioManager.playFile('event-start')
          ↓
[T=0:02] audio = new Audio('/sounds/event-start.mp3')
         audio.volume = 0.7 × 1.0 = 0.7
          ↓
[T=0:02] audioManager.enqueueSound({
           id: 'event-start',
           priority: 0,
           duration: 10000,
           callback: () => audio.play()
         })
          ↓
[T=0:02] console.log('🎵 Som adicionado à fila: event-start')
          ↓
[T=0:02] audioManager.processQueue() // isPlaying era false
          ↓
[T=0:02] Aguarda GAP_BETWEEN_SOUNDS (800ms)
          ↓
[T=0:02] await audio.play()
         console.log('▶️ Tentativa 1/3 de tocar: event-start')
          ↓
[T=0:02] HTMLAudio toca /sounds/event-start.mp3
          ↓
[T=0:02] console.log('✅ Som tocando com sucesso: event-start')
          ↓
[T=0:12] audio.addEventListener('ended') dispara
          ↓
[T=0:12] console.log('✅ Áudio terminado: event-start')
          ↓
[T=0:12] 🔊🔊🔊 VOCÊ OUVE O SOM!
```

---

## ⚠️ Pontos Críticos (Onde Pode Falhar)

### 1. **soundConfig.enabled === false**
- Se `localStorage.getItem('soundConfig')` tem `"enabled": false`
- **playFile()** retorna imediatamente na linha 371
- Nenhum som toca

**Solução:**
```javascript
localStorage.setItem('soundConfig', JSON.stringify({ volume: 0.7, enabled: true }))
location.reload()
```

---

### 2. **isFirstActivation === false**
- Se quest começou há mais de 5 segundos quando você recarrega a página
- Log: `🔇 [CurrentQuestTimer] Quest já está tocando há Xs`
- Som não toca (é considerado reload)

**Solução:** Deixe a página aberta enquanto questões estão ativas

---

### 3. **phaseChanged é falso quando deveria ser true**
- Se `previousPhaseRef.current === null` (ainda não foi definido)
- Linha 489: `const phaseChanged = previousPhaseRef.current !== null && previousPhaseRef.current !== phase`

**Solução:** Garantir que `phase` está sendo passado corretamente no useEffect dependencies (linha 522)

---

### 4. **AudioContext está suspenso**
- Browser secrity: AudioContext começa em 'suspended' até interação
- playFile() detecta isto em linha 459-462 e tenta retomar
- Mas se `resumeAudioContext()` falhar, áudio não toca

**Solução:** Clicar em qualquer lugar da página para autorizar

---

### 5. **Arquivo não existe ou caminho errado**
- Se `/sounds/event-start.mp3` retorna 404
- Audio.play() vai resultar em erro
- handleError() é disparado mas som ainda não toca

**Verificação:**
```javascript
fetch('/sounds/event-start.mp3')
  .then(r => console.log('Status:', r.status))
```

---

### 6. **Volume está 0**
- `AUDIO_VOLUMES['event-start'] = 1.0` (máximo específico)
- `this.config.volume` pode estar 0
- `audio.volume = 0 × 1.0 = 0` → Som "toca" mas mudo

**Verificação:**
```javascript
localStorage.getItem('soundConfig') // Verificar que volume > 0
```

---

### 7. **Browser autoplay policy bloqueado**
- Chrome/Firefox bloqueiam autoplay até interação
- **IMPORTANTE:** `setupAutoAudioAuthorization()` em audioContext.ts lida com isto
- Se setupAutoAudioAuthorization() não foi chamado, erro `NotAllowedError`

**Verificação:**
- Ver log: `✅ Áudio autorizado automaticamente após interação`
- Se não aparecer, clicar na página

---

## 📊 Checklist de Diagnóstico Rápido

```
1. Arquivo existe?
   fetch('/sounds/event-start.mp3').then(r => console.log(r.status))
   → Esperado: 200 OK

2. Configuração OK?
   JSON.parse(localStorage.getItem('soundConfig'))
   → Esperado: {volume: 0.7, enabled: true}

3. AudioContext OK?
   new (window.AudioContext || window.webkitAudioContext)().state
   → Esperado: "running"

4. Som toca manualmente?
   new Audio('/sounds/event-start.mp3').play()
   → Esperado: Você ouve o som

5. Hook é chamado?
   Procure por: "📞 [useSoundSystem.play] Chamado com tipo: event-start"
   → Se não aparecer: Hook não foi chamado ou isFirstActivation = false

6. Som foi enfileirado?
   Procure por: "🎵 Som adicionado à fila: event-start"
   → Se não aparecer: enqueueSound() não foi chamado

7. Som foi reproduzido?
   Procure por: "✅ Som tocando com sucesso: event-start"
   → Se não aparecer: audio.play() falhou
```

---

## 🎯 Próximas Ações

1. **Execute AUDIO_DEBUGGING_GUIDE.md:**
   - Abra DevTools (F12)
   - Cliqu e na página (autorizar áudio)
   - Inicie Fase 1
   - Procure por logs específicos

2. **Execute CONSOLE_TEST_COMMANDS.md:**
   - Teste cada som manualmente
   - Verifique configuração localStorage
   - Verifique AudioContext state

3. **Se ainda não funcionar:**
   - Envie screenshot dos logs
   - Envie resultado de `localStorage.getItem('soundConfig')`
   - Envie resultado de `navigator.mediaDevices.enumerateDevices()`

---

**Status:** Pronto para Teste
**Qualidade:** Production-Ready
**Documentação:** Completa
