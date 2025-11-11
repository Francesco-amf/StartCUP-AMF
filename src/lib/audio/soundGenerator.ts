/**
 * Web Audio API Sound Generator
 * Gera sons programaticamente sem necessidade de arquivos de áudio
 * Agora integrado ao novo sistema de áudio centralizado
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
 * Caso contrário, conecta diretamente ao destino
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

    // Resume audio context se necessário (browser requirement)
    if (ctx.state === 'suspended') {
      ctx.resume().catch((err) => {
        console.warn('⚠️ Falha ao retomar contexto de áudio:', err)
      })
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.value = frequency

    // Configurar ganho com envelope de volume
    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

    // Conectar ao destino apropriado
    oscillator.connect(gainNode)

    if (masterGain) {
      // Usar ganho mestre se fornecido (novo sistema)
      gainNode.connect(masterGain)
    } else {
      // Fallback: conectar diretamente ao destino (compatibilidade)
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
 * Sequência de tons - Quest Completa
 * Som alegre e celebratório
 */
export function playQuestComplete(masterGain?: GainNode | null) {
  playTone({ frequency: 659, duration: 150, volume: 0.3, type: 'sine', masterGain }) // E5
  setTimeout(() => playTone({ frequency: 784, duration: 150, volume: 0.3, type: 'sine', masterGain }), 150) // G5
  setTimeout(() => playTone({ frequency: 880, duration: 300, volume: 0.3, type: 'sine', masterGain }), 300) // A5
}

/**
 * Som de Power-up - Suave e mágico
 */
export function playPowerUp(masterGain?: GainNode | null) {
  playTone({ frequency: 523, duration: 100, volume: 0.3, type: 'sine', masterGain }) // C5
  setTimeout(() => playTone({ frequency: 659, duration: 100, volume: 0.3, type: 'sine', masterGain }), 100) // E5
  setTimeout(() => playTone({ frequency: 784, duration: 200, volume: 0.3, type: 'sine', masterGain }), 200) // G5
}

/**
 * Som de início de fase - Épico e solene
 */
export function playPhaseStart(masterGain?: GainNode | null) {
  playTone({ frequency: 440, duration: 200, volume: 0.3, type: 'sine', masterGain }) // A4
  setTimeout(() => playTone({ frequency: 523, duration: 200, volume: 0.3, type: 'sine', masterGain }), 200) // C5
  setTimeout(() => playTone({ frequency: 587, duration: 300, volume: 0.3, type: 'sine', masterGain }), 400) // D5
}

/**
 * Som de fim de fase - Intrigante
 */
export function playPhaseEnd(masterGain?: GainNode | null) {
  playTone({ frequency: 587, duration: 150, volume: 0.3, type: 'sine', masterGain }) // D5
  setTimeout(() => playTone({ frequency: 523, duration: 150, volume: 0.3, type: 'sine', masterGain }), 150) // C5
  setTimeout(() => playTone({ frequency: 440, duration: 300, volume: 0.3, type: 'sine', masterGain }), 300) // A4
}

/**
 * Som de atualização de pontos - Positivo
 */
export function playPointsUpdate(masterGain?: GainNode | null) {
  playTone({ frequency: 440, duration: 80, volume: 0.25, type: 'sine', masterGain }) // A4
  setTimeout(() => playTone({ frequency: 550, duration: 80, volume: 0.25, type: 'sine', masterGain }), 80) // C#5
}

/**
 * Som de notificação geral - Simples
 */
export function playNotification(masterGain?: GainNode | null) {
  playTone({ frequency: 880, duration: 100, volume: 0.25, type: 'sine', masterGain }) // A5
}

/**
 * Som de aviso/alerta
 */
export function playAlert(masterGain?: GainNode | null) {
  playTone({ frequency: 659, duration: 100, volume: 0.25, type: 'sine', masterGain }) // E5
  setTimeout(() => playTone({ frequency: 659, duration: 100, volume: 0.25, type: 'sine', masterGain }), 150) // E5
}

/**
 * Som de erro
 */
export function playError(masterGain?: GainNode | null) {
  playTone({ frequency: 220, duration: 200, volume: 0.25, type: 'sine', masterGain }) // A3
}
