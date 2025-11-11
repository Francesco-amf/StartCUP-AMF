/**
 * Advanced Sound Generator
 * Sons mais complexos e impactantes usando Web Audio API
 * Integrado ao novo sistema de áudio centralizado
 */

import { getAudioContext, getAudioDestination } from './audioContext'

interface SoundOptions {
  frequency?: number
  duration?: number
  volume?: number
  type?: OscillatorType
  masterGain?: GainNode | null
}

/**
 * Reproduz uma onda simples
 * Se masterGain for fornecido, conecta a ele (para controle de volume centralizado)
 */
function playTone(options: SoundOptions = {}) {
  const {
    frequency = 440,
    duration = 200,
    volume = 0.3,
    type = 'sine',
    masterGain = null
  } = options

  try {
    const ctx = getAudioContext()
    if (!ctx) {
      console.warn('❌ Web Audio API não disponível')
      return
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch((err) => {
        console.warn('⚠️ Falha ao retomar contexto:', err)
      })
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.value = frequency

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

    oscillator.connect(gainNode)

    if (masterGain) {
      gainNode.connect(masterGain)
    } else {
      const destination = getAudioDestination()
      if (destination) {
        gainNode.connect(destination)
      }
    }

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)
  } catch (error) {
    console.error('❌ Erro ao reproduzir tom:', error)
  }
}

/**
 * Toca múltiplos tons em paralelo (cria harmonia/acorde)
 * Se masterGain for fornecido, todos os tons conectam a ele
 */
function playChord(
  frequencies: number[],
  duration: number = 500,
  volume: number = 0.2,
  masterGain: GainNode | null = null
) {
  try {
    const ctx = getAudioContext()
    if (!ctx) {
      console.warn('❌ Web Audio API não disponível')
      return
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch((err) => {
        console.warn('⚠️ Falha ao retomar contexto:', err)
      })
    }

    frequencies.forEach((freq) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.value = freq

      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

      oscillator.connect(gainNode)

      if (masterGain) {
        gainNode.connect(masterGain)
      } else {
        const destination = getAudioDestination()
        if (destination) {
          gainNode.connect(destination)
        }
      }

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration / 1000)
    })
  } catch (error) {
    console.error('❌ Erro ao reproduzir acorde:', error)
  }
}

/**
 * Buzina alta e penetrante - para alertas críticos
 */
export function playHorn(masterGain?: GainNode | null) {
  // Buzz duplo com vibração
  playTone({ frequency: 1200, duration: 150, volume: 0.4, type: 'square', masterGain })
  setTimeout(() => playTone({ frequency: 1000, duration: 150, volume: 0.4, type: 'square', masterGain }), 200)
  setTimeout(() => playTone({ frequency: 1200, duration: 150, volume: 0.4, type: 'square', masterGain }), 400)
}

/**
 * Fanfarra épica - para momentos especiais
 */
export function playFanfare(masterGain?: GainNode | null) {
  // Acorde inicial (C major)
  playChord([262, 330, 392], 500, 0.3, masterGain) // C4, E4, G4

  // Melodia ascendente
  setTimeout(() => playTone({ frequency: 440, duration: 150, volume: 0.3, type: 'sine', masterGain }), 500) // A4
  setTimeout(() => playTone({ frequency: 494, duration: 150, volume: 0.3, type: 'sine', masterGain }), 650) // B4
  setTimeout(() => playTone({ frequency: 523, duration: 300, volume: 0.35, type: 'sine', masterGain }), 800) // C5
}

/**
 * Explosion - som de impacto
 */
export function playExplosion(masterGain?: GainNode | null) {
  // Noise-like effect usando square wave sweep
  playTone({ frequency: 150, duration: 300, volume: 0.4, type: 'square', masterGain })
  setTimeout(() => playTone({ frequency: 100, duration: 200, volume: 0.3, type: 'square', masterGain }), 250)
  setTimeout(() => playTone({ frequency: 50, duration: 150, volume: 0.2, type: 'square', masterGain }), 400)
}

/**
 * Ding - som de sino (tipo elevador/ding)
 */
export function playDing(masterGain?: GainNode | null) {
  // Acorde de sino decrescente
  playChord([523, 659, 784], 400, 0.25, masterGain) // C5, E5, G5
  setTimeout(() => playChord([523, 659, 784], 300, 0.15, masterGain), 350)
  setTimeout(() => playChord([523, 659, 784], 200, 0.08, masterGain), 600)
}

/**
 * Bip de erro tipo Windows
 */
export function playErrorBeep(masterGain?: GainNode | null) {
  playTone({ frequency: 750, duration: 100, volume: 0.3, type: 'sine', masterGain })
  setTimeout(() => playTone({ frequency: 400, duration: 100, volume: 0.3, type: 'sine', masterGain }), 150)
}

/**
 * Laser - som futurista (tipo Star Wars)
 */
export function playLaser(masterGain?: GainNode | null) {
  try {
    // Downward pitch sweep (laser sound)
    const ctx = getAudioContext()
    if (!ctx) {
      console.warn('❌ Web Audio API não disponível')
      return
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch((err) => {
        console.warn('⚠️ Falha ao retomar contexto:', err)
      })
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    oscillator.connect(filter)
    filter.connect(gainNode)

    if (masterGain) {
      gainNode.connect(masterGain)
    } else {
      const destination = getAudioDestination()
      if (destination) {
        gainNode.connect(destination)
      }
    }

    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(800, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)

    filter.type = 'highpass'
    filter.frequency.value = 5000

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  } catch (error) {
    console.error('❌ Erro ao reproduzir laser:', error)
  }
}

/**
 * Power-up do tipo videogame (tipo Sonic)
 */
export function playPowerUpGamified(masterGain?: GainNode | null) {
  // Ascendência rápida
  playTone({ frequency: 523, duration: 100, volume: 0.3, type: 'square', masterGain }) // C5
  setTimeout(() => playTone({ frequency: 659, duration: 100, volume: 0.3, type: 'square', masterGain }), 100) // E5
  setTimeout(() => playTone({ frequency: 784, duration: 100, volume: 0.3, type: 'square', masterGain }), 200) // G5
  setTimeout(() => playTone({ frequency: 1047, duration: 150, volume: 0.35, type: 'square', masterGain }), 300) // C6
}

/**
 * Vitória épica (tipo Mario)
 */
export function playVictory(masterGain?: GainNode | null) {
  playTone({ frequency: 523, duration: 150, volume: 0.3, type: 'sine', masterGain }) // C5
  setTimeout(() => playTone({ frequency: 659, duration: 150, volume: 0.3, type: 'sine', masterGain }), 150) // E5
  setTimeout(() => playTone({ frequency: 784, duration: 150, volume: 0.3, type: 'sine', masterGain }), 300) // G5
  setTimeout(() => playTone({ frequency: 1047, duration: 300, volume: 0.35, type: 'sine', masterGain }), 450) // C6
}

/**
 * Countdown - bips rápidos
 */
export function playCountdown(count: number = 3, masterGain?: GainNode | null) {
  const beepDuration = 100
  const interval = 200

  for (let i = 0; i < count; i++) {
    setTimeout(
      () => {
        playTone({
          frequency: 1000 + i * 200,
          duration: beepDuration,
          volume: 0.25,
          type: 'sine',
          masterGain
        })
      },
      i * interval
    )
  }
}

/**
 * Swirl - som de transição suave
 */
export function playSwirl(masterGain?: GainNode | null) {
  try {
    const ctx = getAudioContext()
    if (!ctx) {
      console.warn('❌ Web Audio API não disponível')
      return
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch((err) => {
        console.warn('⚠️ Falha ao retomar contexto:', err)
      })
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)

    if (masterGain) {
      gainNode.connect(masterGain)
    } else {
      const destination = getAudioDestination()
      if (destination) {
        gainNode.connect(destination)
      }
    }

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(200, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.4)

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)
  } catch (error) {
    console.error('❌ Erro ao reproduzir swirl:', error)
  }
}

/**
 * Chime - som de campainha suave
 */
export function playChime(masterGain?: GainNode | null) {
  playChord([523, 784], 600, 0.2, masterGain) // C5, G5
}

/**
 * Buzz - zumbido de vibração
 */
export function playBuzz(duration: number = 300, masterGain?: GainNode | null) {
  playTone({
    frequency: 150,
    duration,
    volume: 0.25,
    type: 'square',
    masterGain
  })
}

/**
 * Glitch - som de erro/falha (tipo efeito digital)
 */
export function playGlitch(masterGain?: GainNode | null) {
  const frequencies = [200, 400, 300, 450, 250]

  frequencies.forEach((freq, i) => {
    setTimeout(
      () => {
        playTone({
          frequency: freq,
          duration: 50,
          volume: 0.2,
          type: 'square',
          masterGain
        })
      },
      i * 60
    )
  })
}

/**
 * Whoosh - som de movimento rápido
 */
export function playWhoosh(masterGain?: GainNode | null) {
  try {
    const ctx = getAudioContext()
    if (!ctx) {
      console.warn('❌ Web Audio API não disponível')
      return
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch((err) => {
        console.warn('⚠️ Falha ao retomar contexto:', err)
      })
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)

    if (masterGain) {
      gainNode.connect(masterGain)
    } else {
      const destination = getAudioDestination()
      if (destination) {
        gainNode.connect(destination)
      }
    }

    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(100, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2)

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  } catch (error) {
    console.error('❌ Erro ao reproduzir whoosh:', error)
  }
}

/**
 * Ascending - som ascendente de sucesso
 */
export function playAscending(masterGain?: GainNode | null) {
  const frequencies = [262, 294, 330, 370, 415, 466, 523]

  frequencies.forEach((freq, i) => {
    setTimeout(
      () => {
        playTone({
          frequency: freq,
          duration: 80,
          volume: 0.25,
          type: 'sine',
          masterGain
        })
      },
      i * 100
    )
  })
}

/**
 * Boss Battle - som épico de chefe
 */
export function playBossBattle(masterGain?: GainNode | null) {
  // Acorde profundo inicial
  playChord([110, 165, 220], 400, 0.3, masterGain) // A2, E2, A3

  // Escalada dramática
  setTimeout(() => playTone({ frequency: 330, duration: 150, volume: 0.3, type: 'sine', masterGain }), 400) // E4
  setTimeout(() => playTone({ frequency: 415, duration: 150, volume: 0.3, type: 'sine', masterGain }), 550) // G#4
  setTimeout(() => playTone({ frequency: 494, duration: 150, volume: 0.3, type: 'sine', masterGain }), 700) // B4

  // Acorde final épico
  setTimeout(() => playChord([330, 415, 494], 300, 0.35, masterGain), 850) // E4, G#4, B4
}
