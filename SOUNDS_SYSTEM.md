# Sistema de Efeitos Sonoros 🎵

## Visão Geral

O sistema de efeitos sonoros foi implementado usando Web Audio API, gerando sons sintetizados programaticamente sem necessidade de arquivos de áudio externos.

## Arquitetura

### 1. **Sound Generator** (`src/lib/audio/soundGenerator.ts`)
Módulo que gera sons usando Web Audio API. Cada som é uma sequência de notas musicais criadas programaticamente.

**Sons Disponíveis:**
- `playQuestComplete()` - 3 notas ascendentes (E5, G5, A5) - sons alegres e celebratórios
- `playPowerUp()` - 3 notas suaves (C5, E5, G5) - som mágico
- `playPhaseStart()` - 3 notas solenes (A4, C5, D5) - início épico
- `playPhaseEnd()` - 3 notas descendentes (D5, C5, A4) - final intrigante
- `playPointsUpdate()` - 2 notas (A4, C#5) - positivo
- `playNotification()` - 1 nota aguda (A5) - simples
- `playAlert()` - 2 notas iguais (E5, E5) - aviso
- `playError()` - 1 nota baixa (A3) - erro

### 2. **Sound Effects Hook** (`src/lib/hooks/useSoundEffects.ts`)

Hook customizado que gerencia:
- **Reprodução de sons**: `play(type: SoundType)`
- **Controle de volume**: `setVolume(0-1)`
- **On/Off**: `toggleSounds()`
- **Persistência**: Salva preferências em `localStorage` com chave `soundConfig`

```typescript
const { play, setVolume, toggleSounds, soundConfig, isClient } = useSoundEffects()

// Reproduzir som
play('power-up')

// Mudar volume (0 a 1)
setVolume(0.5)

// Ativar/desativar
toggleSounds()
```

### 3. **Sound Control Panel** (`src/components/SoundControlPanel.tsx`)

Componente UI com:
- 🔊/🔇 Botão mute/unmute
- 🎚️ Controle deslizante de volume
- 📊 Display de percentual
- 🔔 Botão de teste

## Eventos com Sons Implementados

### 1. **Mudança de Fase** (Live Dashboard)
- Quando a fase atual muda:
  - Toca `phase-end` (som de finalização)
  - Aguarda 600ms
  - Toca `phase-start` (som de início épico)

Localização: `src/app/live-dashboard/page.tsx` (useEffect)

### 2. **Power-up Ativado** (PowerUpActivator)
- Quando um power-up é ativado com sucesso:
  - Toca `power-up` (som mágico)

Localização: `src/components/PowerUpActivator.tsx` (handleActivatePowerUp)

### 3. **Atualização de Pontos** (RankingBoard)
- Quando pontos de uma equipe aumentam:
  - Toca `points-update` (som positivo)

Localização: `src/components/dashboard/RankingBoard.tsx` (useEffect)

### Eventos Potenciais (Não implementados ainda)

Você pode facilmente adicionar sons para:
- Quest completa: `play('quest-complete')`
- Notificações gerais: `play('notification')`
- Alertas: `playAlert()`
- Erros: `playError()`

## Como Usar

### Adicionar Som em um Componente

```typescript
'use client'

import { useSoundEffects } from '@/lib/hooks/useSoundEffects'

export default function MyComponent() {
  const { play } = useSoundEffects()

  const handleAction = () => {
    // Fazer algo
    play('power-up')
  }

  return (
    <button onClick={handleAction}>
      Ativar Power-up
    </button>
  )
}
```

### Controlar Volume Globalmente

O SoundControlPanel no header da live-dashboard permite:
1. Ativar/desativar sons com 🔊/🔇
2. Ajustar volume com slider (0-100%)
3. Testar som com botão 🔔

Preferências são salvas automaticamente em localStorage.

## Características Técnicas

### Vantagens da Implementação
✅ Sem arquivos de áudio para servir
✅ Compatível com todos os navegadores modernos
✅ Controle fino sobre frequência e duração
✅ Totalmente responsivo e offline
✅ Persistência de preferências do usuário

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 14.5+)

### Performance
- ~1KB de código JavaScript
- Áudio gerado em tempo real (não há buffering)
- Sem impacto em performance (usa Web Audio API natively)

## Customização

### Mudar Volume Padrão
`src/lib/hooks/useSoundEffects.ts` - linha 32:
```typescript
volume: 0.7  // Alterar para 0.3 (30%), 0.5 (50%), etc.
```

### Criar Novo Som
`src/lib/audio/soundGenerator.ts`:
```typescript
export function playMyCustomSound() {
  playTone({ frequency: 660, duration: 200, volume: 0.3, type: 'sine' })
  setTimeout(() => playTone({ frequency: 880, duration: 300, volume: 0.3, type: 'sine' }), 200)
}
```

Depois adicionar em `useSoundEffects.ts`:
```typescript
const SOUND_FUNCTIONS: Record<SoundType, () => void> = {
  // ... outros sons
  'my-custom-sound': playMyCustomSound
}

export type SoundType = '...' | 'my-custom-sound'
```

### Ajustar Frequências
- **Notas musicais** (em Hz):
  - A3: 220 | A4: 440 | A5: 880
  - C5: 523 | D5: 587 | E5: 659
  - G5: 784

- **Oscillator types**: 'sine', 'square', 'sawtooth', 'triangle'

## Debugging

Para testar no console:
```javascript
// Obter contexto de áudio
const ctx = new AudioContext()

// Reproduzir nota simples
const osc = ctx.createOscillator()
const gain = ctx.createGain()
osc.connect(gain)
gain.connect(ctx.destination)
osc.frequency.value = 440
gain.gain.setValueAtTime(0.1, ctx.currentTime)
osc.start()
setTimeout(() => osc.stop(), 200)
```

## Roadmap Futuro

- [ ] Som para conclusão de quest
- [ ] Som para avaliador entrar/sair
- [ ] Notificação sonora para evento importante
- [ ] Música de fundo (opcional)
- [ ] Diferentes temas de som (clássico, moderno, futurista)
