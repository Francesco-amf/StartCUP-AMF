# Como Usar Arquivos MP3 para Sons 🎵

## Passo 1: Preparar Seus Arquivos MP3

### 1.1 Criar Pasta para Sons

Crie uma pasta em: `public/sounds/`

```
seu-projeto/
├── public/
│   ├── sounds/              ← Crie essa pasta
│   │   ├── success.mp3
│   │   ├── error.mp3
│   │   ├── power-up.mp3
│   │   └── ... (outros sons)
│   ├── startcup-logo.jpg
│   └── ... (outros arquivos)
```

### 1.2 Adicionar Seus Arquivos MP3

Coloque seus arquivos MP3 na pasta `public/sounds/`

**Arquivo recomendado:**
- Formato: MP3
- Duração: 0.5 - 2 segundos (efeitos sonoros)
- Bitrate: 128 kbps (qualidade vs tamanho)
- Tamanho máximo: 500KB por arquivo

### 1.3 Fontes Livres de Som

Se não tem seus próprios sons, use:

- **Freesound.org** - https://freesound.org (Creative Commons)
- **Zapsplat** - https://www.zapsplat.com (Free SFX)
- **FreeSound.io** - Efeitos sonoros grátis
- **Pixabay Sounds** - https://pixabay.com/sounds
- **OpenGameArt** - https://opengameart.org

Busque por:
- "success sound effect"
- "error beep"
- "power up"
- "notification chime"
- "victory fanfare"

---

## Passo 2: Registrar os Arquivos

Abra `src/lib/hooks/useAudioFiles.ts` e atualize o mapeamento:

```typescript
const AUDIO_FILES: Record<AudioFileType, string> = {
  'success': '/sounds/success.mp3',       // Seu arquivo
  'error': '/sounds/error.mp3',           // Seu arquivo
  'warning': '/sounds/warning.mp3',       // Seu arquivo
  'notification': '/sounds/notification.mp3',
  'power-up': '/sounds/power-up.mp3',
  'victory': '/sounds/victory.mp3',
  'defeat': '/sounds/defeat.mp3',
  'level-up': '/sounds/level-up.mp3',
  'click': '/sounds/click.mp3',
  'buzz': '/sounds/buzz.mp3',
}
```

Se quiser adicionar mais sons:

```typescript
// Adicione ao tipo
export type AudioFileType =
  | 'success'
  | 'error'
  | 'warning'
  | 'notification'
  | 'power-up'
  | 'victory'
  | 'defeat'
  | 'level-up'
  | 'click'
  | 'buzz'
  | 'seu-novo-som'  // ← Adicione

// Adicione ao arquivo mapping
const AUDIO_FILES: Record<AudioFileType, string> = {
  // ... outros
  'seu-novo-som': '/sounds/seu-arquivo.mp3'  // ← Adicione
}

// Adicione ao cache
const audioCache: Record<AudioFileType, HTMLAudioElement | null> = {
  // ... outros
  'seu-novo-som': null  // ← Adicione
}
```

---

## Passo 3: Usar no Seu Componente

### 3.1 Forma Simples

```typescript
'use client'

import { useAudioFiles } from '@/lib/hooks/useAudioFiles'

export default function MeuComponente() {
  const { play } = useAudioFiles()

  return (
    <button onClick={() => play('success')}>
      Tocar Som de Sucesso
    </button>
  )
}
```

### 3.2 Com Controle de Volume

```typescript
'use client'

import { useAudioFiles } from '@/lib/hooks/useAudioFiles'

export default function SoundSettings() {
  const { play, setVolume, toggleSounds, soundConfig } = useAudioFiles()

  return (
    <div>
      {/* Toggle on/off */}
      <button onClick={() => toggleSounds()}>
        {soundConfig.enabled ? '🔊 Desativar' : '🔇 Ativar'}
      </button>

      {/* Volume slider */}
      <input
        type="range"
        min="0"
        max="100"
        value={soundConfig.volume * 100}
        onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
      />

      {/* Test button */}
      <button onClick={() => play('notification')}>
        Testar Som
      </button>
    </div>
  )
}
```

### 3.3 Integrar com PowerUpActivator

```typescript
// src/components/PowerUpActivator.tsx
'use client'

import { useAudioFiles } from '@/lib/hooks/useAudioFiles'

const handleActivatePowerUp = async (powerUpType: string) => {
  const { play } = useAudioFiles()

  setIsLoading(true)

  try {
    const response = await fetch('/api/power-ups/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ powerUpType })
    })

    const data = await response.json()

    if (!response.ok) {
      play('error')  // ← Som de erro
      setError(data.error || 'Erro ao ativar power-up')
      return
    }

    play('power-up')  // ← Som de sucesso

    setSuccess(true)
    setUsedPowerUp(powerUpType)
    setCanUse(false)

  } catch (err) {
    play('error')  // ← Som de erro crítico
    setError('Erro ao ativar power-up. Tente novamente.')
  } finally {
    setIsLoading(false)
  }
}
```

### 3.4 Integrar com RankingBoard

```typescript
// src/components/dashboard/RankingBoard.tsx
'use client'

import { useAudioFiles } from '@/lib/hooks/useAudioFiles'

export default function RankingBoard({ ranking }: RankingBoardProps) {
  const { play } = useAudioFiles()
  const previousLeaderRef = useRef<string | null>(null)

  useEffect(() => {
    if (ranking.length > 0) {
      const currentLeader = ranking[0].team_id

      // Se mudou de líder, tocar som
      if (previousLeaderRef.current !== null && previousLeaderRef.current !== currentLeader) {
        play('victory')  // ← Som de vitória
      }

      previousLeaderRef.current = currentLeader
    }
  }, [ranking, play])

  // ... resto do componente
}
```

### 3.5 Integrar com Live Dashboard

```typescript
// src/app/live-dashboard/page.tsx
'use client'

import { useAudioFiles } from '@/lib/hooks/useAudioFiles'

export default function LiveDashboard() {
  const { play } = useAudioFiles()
  const previousPhaseRef = useRef<number | null>(null)

  // Detectar mudanças de fase e tocar som
  useEffect(() => {
    if (phase?.current_phase !== undefined && phase.current_phase !== previousPhaseRef.current) {
      if (previousPhaseRef.current !== null) {
        play('victory')  // Som de fim de fase
        setTimeout(() => play('level-up'), 600)  // Som de início
      }
      previousPhaseRef.current = phase.current_phase
    }
  }, [phase?.current_phase, play])

  // ... resto do componente
}
```

---

## Passo 4: Trocar o SoundControlPanel

O `SoundControlPanel` atual usa sons sintetizados. Para usar MP3, atualize:

```typescript
// src/components/SoundControlPanel.tsx
'use client'

import { useAudioFiles } from '@/lib/hooks/useAudioFiles'  // ← Mude aqui
import { Button } from '@/components/ui/button'

export default function SoundControlPanel() {
  const { soundConfig, setVolume, toggleSounds, play, isClient } = useAudioFiles()

  if (!isClient) return null

  const getMuteIcon = () => (soundConfig.enabled ? '🔊' : '🔇')

  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
      <Button
        onClick={toggleSounds}
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20"
      >
        {getMuteIcon()}
      </Button>

      <input
        type="range"
        min="0"
        max="100"
        value={soundConfig.enabled ? soundConfig.volume * 100 : 0}
        onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
        className="w-20 md:w-24 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
        disabled={!soundConfig.enabled}
      />

      <span className="text-xs md:text-sm text-purple-200 w-8 md:w-10">
        {Math.round(soundConfig.volume * 100)}%
      </span>

      <Button
        onClick={() => play('notification')}
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20 text-xs"
        disabled={!soundConfig.enabled}
      >
        🔔
      </Button>
    </div>
  )
}
```

---

## Sons Disponíveis

| ID | Tipo | Uso Recomendado |
|-----|------|-----------------|
| `'success'` | Sucesso | Conclusão bem-sucedida, vitória |
| `'error'` | Erro | Falha, validação, erro crítico |
| `'warning'` | Aviso | Alerta, atenção necessária |
| `'notification'` | Notificação | Mensagens gerais, info |
| `'power-up'` | Power-up | Coleta de item, bonus |
| `'victory'` | Vitória | Fase completa, sucesso épico |
| `'defeat'` | Derrota | Falha, fim negativo |
| `'level-up'` | Level Up | Progressão, novo nível |
| `'click'` | Click | Interação UI, botão |
| `'buzz'` | Buzz | Vibração, feedback |

---

## Exemplo Completo

### Estrutura de Pastas

```
public/sounds/
├── success.mp3       (500ms, ~30KB)
├── error.mp3         (300ms, ~20KB)
├── power-up.mp3      (600ms, ~40KB)
├── victory.mp3       (1s, ~60KB)
├── defeat.mp3        (800ms, ~50KB)
├── notification.mp3  (400ms, ~25KB)
├── level-up.mp3      (1.2s, ~70KB)
└── click.mp3         (200ms, ~15KB)
```

### Uso

```typescript
'use client'

import { useAudioFiles } from '@/lib/hooks/useAudioFiles'

export default function Game() {
  const { play } = useAudioFiles()

  const handleSuccess = () => {
    play('success')
    // Fazer algo...
  }

  const handleError = () => {
    play('error')
    // Lidar com erro...
  }

  const handleLevelUp = () => {
    play('victory')
    setTimeout(() => play('level-up'), 500)
    // Avançar para próximo nível...
  }

  return (
    <div>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
      <button onClick={handleLevelUp}>Level Up</button>
    </div>
  )
}
```

---

## Performance

| Métrica | Valor |
|---------|-------|
| Cache em memória | ~500KB (10 arquivos) |
| Latência | <50ms |
| Compatibilidade | 95%+ browsers |
| Formato | MP3, WAV, OGG |

---

## Troubleshooting

**P: Som não toca**
R: Verifique se arquivo existe em `public/sounds/` e se está registrado em `useAudioFiles.ts`

**P: Som está muito alto**
R: Reduza volume no slider ou diminua volume do arquivo original

**P: Arquivo muito pesado**
R: Comprima com Audacity ou compressor online (mire em <100KB)

**P: Preciso adicionar novo som**
R: 1) Coloque em `public/sounds/`, 2) Registre em `useAudioFiles.ts`, 3) Use com `play('seu-id')`

**P: Funcionam em mobile?**
R: Sim, mas note que mobile geralmente requer user interaction primeiro

---

## Otimização

### Compressão de Áudio

Use **Audacity** (grátis):
1. Abra arquivo MP3
2. Export → MP3
3. Bitrate: 128 kbps
4. Salve em `public/sounds/`

### Converter para OGG (mais compacto)

```bash
ffmpeg -i input.mp3 -q:a 4 output.ogg
```

---

**Pronto para usar seus próprios sons MP3!** 🎉
