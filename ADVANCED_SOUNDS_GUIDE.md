# Guia de Sons Impactantes 🎵

## Visão Geral

O sistema foi estendido com **16 sons diferentes** - desde sintetizados básicos até efeitos sonoros complexos e impactantes. Todos gerados em tempo real sem arquivos externos.

## Categorias de Sons

### 1️⃣ Sons Básicos (6 tipos)

Já implementados e em uso:

| Som | Uso | Tipo |
|-----|-----|------|
| 🎯 quest-complete | Quando quest termina | Melodia alegre |
| 🚀 phase-start | Quando fase inicia | Épico solene |
| ⏹ phase-end | Quando fase termina | Intrigante |
| ⚡ power-up | Quando power-up é ativado | Mágico suave |
| 📈 points-update | Quando pontos aumentam | Positivo |
| 🔔 notification | Notificações gerais | Simples |

### 2️⃣ Sons Avançados/Impactantes (16 tipos)

Novos sons para momentos especiais:

#### 🔊 Alertas e Avisos

| Som | Técnica | Quando usar |
|-----|---------|------------|
| **🎺 Horn** | 3 buzz altos em square wave | Alertas críticos que precisam atenção imediata |
| **⚠ Error Beep** | 2 bips (750Hz → 400Hz) | Erros ou validações falhadas |
| **🖥 Glitch** | 5 notas aleatórias em square | Falhas de sistema ou bugs |

#### 🎭 Momentos Especiais

| Som | Técnica | Quando usar |
|-----|---------|------------|
| **🎪 Fanfare** | Acorde + melodia ascendente | Anúncios importantes, aberturas |
| **👑 Victory** | Escala C-E-G-C (Mario style) | Vitória, sucesso, conclusão |
| **⚔ Boss Battle** | Acordes épicos progressivos | Chefes de fase, desafios finais |

#### 💥 Impacto Físico

| Som | Técnica | Quando usar |
|-----|---------|------------|
| **🔥 Explosion** | 3 buzz descendentes | Destruição, derrota, impacto |
| **💨 Whoosh** | Sweep de sawtooth (100→400Hz) | Movimento rápido, transição |
| **🌪 Swirl** | Sweep suave (200→1000Hz) | Transição elegante, efeito mágico |

#### 🎮 Estilo Videogame

| Som | Técnica | Quando usar |
|-----|---------|------------|
| **👾 Power-up Gamified** | Square wave ascendente rápida | Coleta de itens, bonus |
| **⏱ Countdown** | Bips acelerados progressivos | Aviso de tempo acabando |
| **📊 Ascending** | Escala C-D-E-F-G-A-B-C | Progresso steadily |

#### 🎵 Suave e Musical

| Som | Técnica | Quando usar |
|-----|---------|------------|
| **🛎 Ding** | Acorde decrescente (sino) | Confirmação, elevador chegando |
| **🔮 Chime** | Acorde C-G 600ms | Notificação elegante |
| **⚡ Laser** | Sawtooth sweep descendente | Efeito futurista, ação especial |

#### 📳 Táctil

| Som | Técnica | Quando usar |
|-----|---------|------------|
| **📲 Buzz** | Buzz de frequência baixa | Vibração, feedback tátil |

---

## Como Usar

### 1. Opção Simples: Trocar Hook

Substitua `useSoundEffects` por `useAdvancedSounds`:

```typescript
'use client'

import { useAdvancedSounds } from '@/lib/hooks/useAdvancedSounds'

export default function MyComponent() {
  const { play } = useAdvancedSounds()

  const handleWin = () => {
    play('victory')
  }

  return <button onClick={handleWin}>Vencer!</button>
}
```

### 2. Exemplos Práticos

#### Quando Boss é Vencido
```typescript
const handleBossDefeated = () => {
  play('explosion')
  setTimeout(() => play('victory'), 500)
}
```

#### Aviso de Tempo Acabando (últimos 10 segundos)
```typescript
useEffect(() => {
  if (timeLeft.seconds === 10) {
    play('countdown')
  }
}, [timeLeft.seconds, play])
```

#### Quando Algo Crítico Acontece
```typescript
const handleCriticalError = () => {
  play('horn')
  play('error-beep')
}
```

#### Transição de Tela
```typescript
const handleNavigate = () => {
  play('swirl')
  setTimeout(() => router.push('/next-page'), 400)
}
```

### 3. Criar Sequências de Sons

```typescript
const playSoundSequence = async () => {
  play('fanfare')
  await sleep(500)
  play('victory')
  await sleep(400)
  play('chime')
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
```

---

## Testador Interativo

Acesse `/sounds-test` para testar todos os sons e ouvir como soam!

URL: `http://localhost:3000/sounds-test`

---

## Técnicas Usadas

### 1. Tone Playback
Sons simples usando `OscillatorNode`:
```typescript
playTone({ frequency: 440, duration: 200, volume: 0.3, type: 'sine' })
```

**Types de onda:**
- `sine`: Som suave, musical
- `square`: Som duro, tipo videogame
- `sawtooth`: Som brilhante, áspero
- `triangle`: Entre sine e square

### 2. Chord (Acordes)
Múltiplas frequências em paralelo:
```typescript
playChord([523, 659, 784], 500, 0.2) // C5, E5, G5
```

### 3. Pitch Sweep (Varredura de Frequência)
Frequência muda ao longo do tempo:
```typescript
oscillator.frequency.setValueAtTime(1000, ctx.currentTime)
oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
```

### 4. Gain Envelope (Envoltório de Amplitude)
Controla volume ao longo do tempo:
```typescript
gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
```

### 5. Filter (Filtro)
Modifica qualidade espectral:
```typescript
const filter = ctx.createBiquadFilter()
filter.type = 'highpass'
filter.frequency.value = 5000
```

---

## Performance

| Métrica | Valor |
|---------|-------|
| Tamanho de código | ~6KB |
| Latência de reprodução | <10ms |
| Impacto em performance | Negligível |
| Suporte de browser | 95%+ (IE11+ não suporta) |

---

## Dicas Pro

### 🎯 Estilo Game
Para um app estilo jogo/gamificação:
```typescript
play('power-up-gamified')  // Ao coletar itens
play('countdown')          // Aviso de tempo
play('victory')            // Ao completar
play('explosion')          // Ao falhar
```

### 🎬 Estilo Cinema
Para um app mais sofisticado:
```typescript
play('swirl')              // Transições
play('fanfare')            // Anúncios
play('chime')              // Confirmações
play('ascending')          // Progresso
```

### 🚨 Estilo Alertas
Para sistema de notificações:
```typescript
play('horn')               // Alerta crítico
play('error-beep')         // Erro
play('glitch')             // Falha de sistema
play('buzz')               // Notificação suave
```

---

## Customização Avançada

### Criar Novo Som
`src/lib/audio/advancedSoundGenerator.ts`:

```typescript
export function playMySound() {
  // Seu código aqui
  playTone({ frequency: 440, duration: 300, volume: 0.3, type: 'sine' })
  setTimeout(() => playTone({ frequency: 880, duration: 300, volume: 0.3, type: 'sine' }), 300)
}
```

Depois adicionar em `useAdvancedSounds.ts`:
```typescript
const ADVANCED_SOUND_FUNCTIONS: Record<AdvancedSoundType, () => void> = {
  // ... outros sons
  'my-sound': playMySound
}

export type AdvancedSoundType = '...' | 'my-sound'
```

### Ajustar Frequências

**Escala de notas (Hz):**
```
C3: 131  | A3: 220  | E4: 330
C4: 262  | A4: 440  | E5: 659
C5: 523  | A5: 880  | E6: 1318
```

**Criar acorde maior (C major):**
```typescript
playChord([262, 330, 392]) // C4, E4, G4
```

**Criar acorde menor (A minor):**
```typescript
playChord([220, 262, 330]) // A3, C4, E4
```

---

## Roadmap Futuro

- [ ] Música de fundo (loop suave)
- [ ] Sistema de temas de som (clássico, moderno, futurista, 8-bit)
- [ ] Efeitos de reverberação
- [ ] Compressor de áudio
- [ ] Equalizer customizável
- [ ] Sons de ambiente (chuva, vento, etc)
- [ ] Integração com Web Haptics API (vibração)

---

## Troubleshooting

### Som não toca em alguns browsers
Possível problema: Audio context não iniciado. Solução:
```typescript
useEffect(() => {
  // Click do usuário inicia audio context
  const handleClick = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    ctx.resume()
  }
  document.addEventListener('click', handleClick)
  return () => document.removeEventListener('click', handleClick)
}, [])
```

### Som muito alto ou baixo
Ajuste `volume` em `useSoundEffects.ts`:
```typescript
volume: 0.3  // Mais baixo
volume: 0.7  // Padrão
volume: 1.0  // Máximo
```

### Latência entre som e ação
Normal com Web Audio API. Se crítico, use:
```typescript
play('sound')  // Toca imediatamente
// Depois execute ação
performAction()
```

---

## Referências

- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Frequency Table - Musical Notes](https://pages.mtu.edu/~suits/notefreqs.html)
- [Oscillator Types - MDN](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode/type)
