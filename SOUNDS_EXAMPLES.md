# Exemplos Práticos de Uso de Sons 🎵

## Exemplo 1: Adicionar Sons Impactantes na Live Dashboard

### Substituir os sons básicos por sons avançados:

**Antes:**
```typescript
// src/app/live-dashboard/page.tsx
const { play } = useSoundEffects()

useEffect(() => {
  if (phase?.current_phase !== undefined && phase.current_phase !== previousPhaseRef.current) {
    if (previousPhaseRef.current !== null) {
      play('phase-end')
      setTimeout(() => play('phase-start'), 600)
    }
    previousPhaseRef.current = phase.current_phase
  }
}, [phase?.current_phase, play])
```

**Depois (com sons avançados):**
```typescript
// src/app/live-dashboard/page.tsx
import { useAdvancedSounds } from '@/lib/hooks/useAdvancedSounds'

const { play } = useAdvancedSounds()

useEffect(() => {
  if (phase?.current_phase !== undefined && phase.current_phase !== previousPhaseRef.current) {
    if (previousPhaseRef.current !== null) {
      // Som mais impactante para mudança de fase
      play('fanfare')
      setTimeout(() => play('whoosh'), 600)
    }
    previousPhaseRef.current = phase.current_phase
  }
}, [phase?.current_phase, play])
```

---

## Exemplo 2: Aviso de Tempo Acabando

Adicionar em `CurrentQuestTimer.tsx`:

```typescript
import { useAdvancedSounds } from '@/lib/hooks/useAdvancedSounds'

export default function CurrentQuestTimer({
  phase,
  phaseStartedAt,
  phaseDurationMinutes
}: CurrentQuestTimerProps) {
  const { play } = useAdvancedSounds()
  const playedWarningRef = useRef(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      // ... cálculo existente ...

      // Avisar quando faltam 10 segundos
      if (timeLeft.seconds === 10 && timeLeft.minutes === 0 && !playedWarningRef.current) {
        play('countdown')
        playedWarningRef.current = true
      }

      // Reset quando muda de minuto
      if (timeLeft.seconds === 59) {
        playedWarningRef.current = false
      }
    }

    // ... resto do código ...
  }, [play])
}
```

---

## Exemplo 3: Som de Vitória Quando Equipe Vence

Adicionar em `RankingBoard.tsx`:

```typescript
import { useAdvancedSounds } from '@/lib/hooks/useAdvancedSounds'

export default function RankingBoard({ ranking }: RankingBoardProps) {
  const { play } = useAdvancedSounds()
  const previousLeaderRef = useRef<string | null>(null)

  useEffect(() => {
    if (ranking.length > 0) {
      const currentLeader = ranking[0].team_id

      // Se mudou de líder, tocar som de vitória
      if (previousLeaderRef.current !== null && previousLeaderRef.current !== currentLeader) {
        play('victory')  // Som épico para nova vitória
        setTimeout(() => play('fanfare'), 600)  // Seguido de fanfarra
      }

      previousLeaderRef.current = currentLeader
    }
  }, [ranking, play])
}
```

---

## Exemplo 4: Sons para PowerUpActivator

Adicionar efeitos sonoros mais interessantes:

```typescript
// src/components/PowerUpActivator.tsx
import { useAdvancedSounds } from '@/lib/hooks/useAdvancedSounds'

const handleActivatePowerUp = async (powerUpType: string) => {
  const { play } = useAdvancedSounds()

  setIsLoading(true)

  try {
    const response = await fetch('/api/power-ups/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ powerUpType })
    })

    const data = await response.json()

    if (!response.ok) {
      // Som de erro em caso de falha
      play('error-beep')
      setError(data.error || 'Erro ao ativar power-up')
      return
    }

    // Som de sucesso - usar power-up-gamified para estilo de jogo
    play('power-up-gamified')

    // Tocar chime elegante após
    setTimeout(() => play('chime'), 400)

    setSuccess(true)
    setUsedPowerUp(powerUpType)
    setCanUse(false)

  } catch (err) {
    play('glitch')  // Som de glitch para erro crítico
    setError('Erro ao ativar power-up. Tente novamente.')
  } finally {
    setIsLoading(false)
  }
}
```

---

## Exemplo 5: Criar Notificações com Som

Novo componente `SoundNotification.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useAdvancedSounds } from '@/lib/hooks/useAdvancedSounds'
import { Card } from '@/components/ui/card'

interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export function useNotificationWithSound() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { play } = useAdvancedSounds()

  const notify = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)

    // Tocar som baseado no tipo
    switch (type) {
      case 'success':
        play('victory')
        break
      case 'error':
        play('error-beep')
        break
      case 'warning':
        play('horn')
        break
      case 'info':
        play('chime')
        break
    }

    setNotifications(prev => [...prev, { id, message, type }])

    // Remover após 4 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 4000)
  }

  return { notifications, notify }
}

export default function NotificationContainer() {
  const { notifications } = useNotificationWithSound()

  const getColors = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {notifications.map(notif => (
        <Card key={notif.id} className={`${getColors(notif.type)} text-white p-4 rounded`}>
          {notif.message}
        </Card>
      ))}
    </div>
  )
}
```

---

## Exemplo 6: Sequência de Sons para Boss Battle

Adicionar em um componente de Boss:

```typescript
const handleBossBattle = () => {
  const { play } = useAdvancedSounds()

  // Sequência de sons épica
  play('boss-battle')

  // Depois de 2 segundos, iniciar batalha
  setTimeout(() => {
    startBattle()
    play('laser')  // Som de ataque
  }, 2000)
}

const handleBossDefeated = () => {
  const { play } = useAdvancedSounds()

  // Sequência de vitória
  play('explosion')
  setTimeout(() => play('victory'), 500)
  setTimeout(() => play('fanfare'), 1200)
}
```

---

## Exemplo 7: Sistema de Feedback de Entrada

Adicionar em formulários:

```typescript
'use client'

import { useAdvancedSounds } from '@/lib/hooks/useAdvancedSounds'

export default function FormWithSoundFeedback() {
  const { play } = useAdvancedSounds()

  const handleInputFocus = () => {
    play('swirl')  // Som suave ao focar
  }

  const handleInputBlur = () => {
    play('ding')  // Som ao desfocar
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    play('ascending')  // Som ascendente ao enviar

    // Enviar formulário...

    // Se sucesso:
    play('victory')

    // Se erro:
    // play('error-beep')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder="Seu email"
      />
      <button type="submit">Enviar</button>
    </form>
  )
}
```

---

## Exemplo 8: Combos de Sons Coordenados

Criar "efeitos sonoros cinematográficos":

```typescript
const soundSequences = {
  // Quando algo crítico acontece
  alertCritical: async (play: Function) => {
    play('horn')
    await sleep(200)
    play('error-beep')
    await sleep(300)
    play('glitch')
  },

  // Sequência de progresso
  progressSequence: async (play: Function) => {
    play('ascending')
    await sleep(800)
    play('victory')
  },

  // Transição épica
  epicTransition: async (play: Function) => {
    play('fanfare')
    await sleep(1000)
    play('whoosh')
  },

  // Abertura cinematográfica
  cinematicOpening: async (play: Function) => {
    play('boss-battle')
    await sleep(500)
    play('swirl')
    await sleep(400)
    play('fanfare')
  }
}

// Usar:
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const handleSpecialEvent = async () => {
  const { play } = useAdvancedSounds()
  await soundSequences.epicTransition(play)
  // Depois fazer algo
}
```

---

## Exemplo 9: Customizar Volume por Som

Sistema avançado:

```typescript
interface SoundVolumes {
  [key: string]: number
}

const customVolumes: SoundVolumes = {
  'horn': 0.4,           // Mais alto
  'notification': 0.2,   // Mais baixo
  'victory': 0.5,        // Médio
  'error-beep': 0.35,   // Médio-alto
}

export function useCustomSounds() {
  const { play: originalPlay, soundConfig, setVolume } = useAdvancedSounds()

  const play = (type: string) => {
    const customVol = customVolumes[type]
    if (customVol !== undefined) {
      setVolume(customVol)
      originalPlay(type as any)
      setVolume(soundConfig.volume) // Restaurar
    } else {
      originalPlay(type as any)
    }
  }

  return { play, setVolume }
}
```

---

## Exemplo 10: Temas de Som

Sistema de "skins" sonoras:

```typescript
type SoundTheme = 'arcade' | 'cinematic' | 'minimalist'

const soundThemes: Record<SoundTheme, Record<string, string>> = {
  arcade: {
    'success': 'victory',
    'error': 'error-beep',
    'warning': 'horn',
    'transition': 'power-up-gamified'
  },
  cinematic: {
    'success': 'fanfare',
    'error': 'glitch',
    'warning': 'boss-battle',
    'transition': 'swirl'
  },
  minimalist: {
    'success': 'chime',
    'error': 'error-beep',
    'warning': 'buzz',
    'transition': 'ding'
  }
}

export function useThemedSounds(theme: SoundTheme) {
  const { play: originalPlay } = useAdvancedSounds()
  const themeMap = soundThemes[theme]

  const play = (semanticSound: string) => {
    const actualSound = themeMap[semanticSound] || semanticSound
    originalPlay(actualSound as any)
  }

  return { play }
}

// Usar:
const { play } = useThemedSounds('arcade')
play('success')  // Toca 'victory'
```

---

## Checklist de Integração

- [ ] Importar `useAdvancedSounds` (não `useSoundEffects`)
- [ ] Chamar `play()` nos eventos desejados
- [ ] Testar em `/sounds-test` antes
- [ ] Ajustar volumes se necessário
- [ ] Considerar acessibilidade (opção on/off)
- [ ] Testar em diferentes browsers
- [ ] Validar latência não afeta UX

---

## Dúvidas Frequentes

**P: Qual som usar para cada evento?**
R: Veja a seção "Sugestões de Uso" em ADVANCED_SOUNDS_GUIDE.md

**P: Posso usar múltiplos sons ao mesmo tempo?**
R: Sim, use `setTimeout` para criar sequências ou `playChord` para harmonia.

**P: Sons funcionam em mobile?**
R: Sim, mas respeite a política do Safari (requer interação do usuário).

**P: Qual é o latência dos sons?**
R: <10ms geralmente. Se crítico, toque som ANTES de executar ação.

**P: Posso fazer fade in/out?**
R: Sim, ajuste o `gainNode.gain.setValueAtTime()`.
