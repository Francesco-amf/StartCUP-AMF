/**
 * Custom Sound Generator
 * Adicione seus próprios sons aqui!
 *
 * Guia de frequências (Hz):
 * C3: 131   | A3: 220   | E4: 330   | C5: 523
 * C4: 262   | A4: 440   | E5: 659   | C6: 1047
 */

type AudioContext = InstanceType<typeof AudioContext>

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

/**
 * Reproduz uma onda simples
 */
function playTone(options: {
  frequency?: number
  duration?: number
  volume?: number
  type?: OscillatorType
} = {}) {
  const {
    frequency = 440,
    duration = 200,
    volume = 0.3,
    type = 'sine'
  } = options

  try {
    const ctx = getAudioContext()

    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = type
    oscillator.frequency.value = frequency

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)
  } catch (error) {
    console.log('Audio context unavailable:', error)
  }
}

/**
 * EXEMPLO 1: Som de Sucesso Customizado
 * ────────────────────────────────────────
 * Descrição: Som alegre com 3 notas ascendentes
 * Caso de uso: Quando algo é concluído com sucesso
 */
export function playCustomSuccess() {
  // Primeira nota - sol agudo
  playTone({ frequency: 784, duration: 200, volume: 0.3, type: 'sine' })

  // Segunda nota - lá agudo
  setTimeout(() => {
    playTone({ frequency: 880, duration: 200, volume: 0.3, type: 'sine' })
  }, 200)

  // Terceira nota - dó mais agudo
  setTimeout(() => {
    playTone({ frequency: 1047, duration: 300, volume: 0.35, type: 'sine' })
  }, 400)
}

/**
 * EXEMPLO 2: Som de Alerta Urgente
 * ─────────────────────────────────
 * Descrição: Dois bips alternados e crescentes
 * Caso de uso: Alertas críticos, tempo acabando
 */
export function playCustomUrgent() {
  // Primeiro bip baixo
  playTone({ frequency: 600, duration: 150, volume: 0.25, type: 'square' })

  // Segundo bip mais alto
  setTimeout(() => {
    playTone({ frequency: 800, duration: 150, volume: 0.3, type: 'square' })
  }, 200)

  // Terceiro bip ainda mais alto
  setTimeout(() => {
    playTone({ frequency: 1000, duration: 150, volume: 0.35, type: 'square' })
  }, 400)
}

/**
 * EXEMPLO 3: Som de Transição Suave
 * ──────────────────────────────────
 * Descrição: Variação suave de frequência (whoosh)
 * Caso de uso: Mudança de tela, transições
 */
export function playCustomTransition() {
  try {
    const ctx = getAudioContext()

    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'

    // Começa em 300Hz e sobe para 800Hz
    oscillator.frequency.setValueAtTime(300, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5)

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  } catch (error) {
    console.log('Transition sound failed:', error)
  }
}

/**
 * EXEMPLO 4: Som de Confirmação
 * ──────────────────────────────
 * Descrição: Ding duplo
 * Caso de uso: Confirmação de ação, submissão
 */
export function playCustomConfirm() {
  // Primeiro ding
  playTone({ frequency: 523, duration: 150, volume: 0.3, type: 'sine' })

  // Segundo ding mais agudo
  setTimeout(() => {
    playTone({ frequency: 659, duration: 200, volume: 0.35, type: 'sine' })
  }, 150)
}

/**
 * EXEMPLO 5: Som de Erro Customizado
 * ──────────────────────────────────
 * Descrição: Buzz descendente (falha)
 * Caso de uso: Erros, validações falhadas
 */
export function playCustomError() {
  // Nota alta
  playTone({ frequency: 900, duration: 200, volume: 0.3, type: 'square' })

  // Nota baixa
  setTimeout(() => {
    playTone({ frequency: 300, duration: 200, volume: 0.25, type: 'square' })
  }, 200)
}

/**
 * EXEMPLO 6: Som de Notificação Suave
 * ──────────────────────────────────
 * Descrição: Sino elegante
 * Caso de uso: Notificações gerais, eventos suaves
 */
export function playCustomNotify() {
  // Acorde de sino
  try {
    const ctx = getAudioContext()

    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const frequencies = [523, 659, 784] // C5, E5, G5

    frequencies.forEach((freq) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.value = freq

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.6)
    })
  } catch (error) {
    console.log('Notify sound failed:', error)
  }
}

/**
 * EXEMPLO 7: Som de Progresso
 * ──────────────────────────
 * Descrição: Escada musical ascendente (5 notas)
 * Caso de uso: Progresso, avanço em etapas
 */
export function playCustomProgress() {
  const frequencies = [262, 294, 330, 370, 415] // C4 até G4

  frequencies.forEach((freq, i) => {
    setTimeout(() => {
      playTone({ frequency: freq, duration: 100, volume: 0.25, type: 'sine' })
    }, i * 120)
  })
}

/**
 * EXEMPLO 8: Som Retro de Videogame
 * ────────────────────────────────
 * Descrição: Beep rápido tipo 8-bit
 * Caso de uso: Coleta de itens, pontos, eventos gamificados
 */
export function playCustomRetro() {
  playTone({ frequency: 400, duration: 80, volume: 0.25, type: 'square' })
  setTimeout(() => playTone({ frequency: 600, duration: 80, volume: 0.25, type: 'square' }), 100)
  setTimeout(() => playTone({ frequency: 800, duration: 120, volume: 0.3, type: 'square' }), 200)
}

/**
 * EXEMPLO 9: Som de Derrota
 * ─────────────────────────
 * Descrição: Melodia descendente triste
 * Caso de uso: Falha, derrota, fim negativo
 */
export function playCustomDefeat() {
  playTone({ frequency: 659, duration: 200, volume: 0.3, type: 'sine' }) // E5
  setTimeout(() => playTone({ frequency: 587, duration: 200, volume: 0.3, type: 'sine' }), 200) // D5
  setTimeout(() => playTone({ frequency: 523, duration: 200, volume: 0.3, type: 'sine' }), 400) // C5
  setTimeout(() => playTone({ frequency: 440, duration: 300, volume: 0.25, type: 'sine' }), 600) // A4
}

/**
 * EXEMPLO 10: Som de Countdown
 * ─────────────────────────────
 * Descrição: 3 bips rápidos e crescentes
 * Caso de uso: Tempo acabando, contagem regressiva
 */
export function playCustomCountdown() {
  playTone({ frequency: 700, duration: 100, volume: 0.25, type: 'sine' })
  setTimeout(() => playTone({ frequency: 800, duration: 100, volume: 0.28, type: 'sine' }), 120)
  setTimeout(() => playTone({ frequency: 900, duration: 150, volume: 0.3, type: 'sine' }), 240)
}

/**
 * ═══════════════════════════════════════════════════════════════
 * TEMPLATE VAZIO PARA CRIAR SEU PRÓPRIO SOM
 * ═══════════════════════════════════════════════════════════════
 *
 * export function playCustomYourSoundName() {
 *   // Escreva seu código aqui
 *   playTone({ frequency: 440, duration: 200, volume: 0.3, type: 'sine' })
 * }
 *
 * Frequências úteis:
 * - Baixo: 100-300 Hz
 * - Médio: 300-600 Hz
 * - Alto: 600-1200 Hz
 * - Muito alto: 1200+ Hz
 *
 * Tipos de onda:
 * - 'sine': Suave, musical
 * - 'square': Duro, tipo videogame
 * - 'sawtooth': Brilhante, áspero
 * - 'triangle': Entre sine e square
 *
 * Volume:
 * - 0.1: Muito baixo
 * - 0.3: Padrão
 * - 0.5: Alto
 * - 0.7+: Muito alto (cuidado!)
 */
