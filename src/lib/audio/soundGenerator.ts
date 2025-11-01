/**
 * Web Audio API Sound Generator
 * Gera sons programaticamente sem necessidade de arquivos de áudio
 */

type AudioContext = InstanceType<typeof AudioContext>

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

interface SoundOptions {
  frequency?: number
  duration?: number
  volume?: number
  type?: OscillatorType
}

/**
 * Reproduz uma onda simples
 */
function playTone(options: SoundOptions = {}) {
  const {
    frequency = 440,
    duration = 200,
    volume = 0.3,
    type = 'sine'
  } = options

  try {
    const ctx = getAudioContext()

    // Resume audio context se necessário (browser requirement)
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
 * Sequência de tons - Quest Completa
 * Som alegre e celebratório
 */
export function playQuestComplete() {
  playTone({ frequency: 659, duration: 150, volume: 0.3, type: 'sine' }) // E5
  setTimeout(() => playTone({ frequency: 784, duration: 150, volume: 0.3, type: 'sine' }), 150) // G5
  setTimeout(() => playTone({ frequency: 880, duration: 300, volume: 0.3, type: 'sine' }), 300) // A5
}

/**
 * Som de Power-up - Suave e mágico
 */
export function playPowerUp() {
  playTone({ frequency: 523, duration: 100, volume: 0.3, type: 'sine' }) // C5
  setTimeout(() => playTone({ frequency: 659, duration: 100, volume: 0.3, type: 'sine' }), 100) // E5
  setTimeout(() => playTone({ frequency: 784, duration: 200, volume: 0.3, type: 'sine' }), 200) // G5
}

/**
 * Som de início de fase - Épico e solene
 */
export function playPhaseStart() {
  playTone({ frequency: 440, duration: 200, volume: 0.3, type: 'sine' }) // A4
  setTimeout(() => playTone({ frequency: 523, duration: 200, volume: 0.3, type: 'sine' }), 200) // C5
  setTimeout(() => playTone({ frequency: 587, duration: 300, volume: 0.3, type: 'sine' }), 400) // D5
}

/**
 * Som de fim de fase - Intrigante
 */
export function playPhaseEnd() {
  playTone({ frequency: 587, duration: 150, volume: 0.3, type: 'sine' }) // D5
  setTimeout(() => playTone({ frequency: 523, duration: 150, volume: 0.3, type: 'sine' }), 150) // C5
  setTimeout(() => playTone({ frequency: 440, duration: 300, volume: 0.3, type: 'sine' }), 300) // A4
}

/**
 * Som de atualização de pontos - Positivo
 */
export function playPointsUpdate() {
  playTone({ frequency: 440, duration: 80, volume: 0.25, type: 'sine' }) // A4
  setTimeout(() => playTone({ frequency: 550, duration: 80, volume: 0.25, type: 'sine' }), 80) // C#5
}

/**
 * Som de notificação geral - Simples
 */
export function playNotification() {
  playTone({ frequency: 880, duration: 100, volume: 0.25, type: 'sine' }) // A5
}

/**
 * Som de aviso/alerta
 */
export function playAlert() {
  playTone({ frequency: 659, duration: 100, volume: 0.25, type: 'sine' }) // E5
  setTimeout(() => playTone({ frequency: 659, duration: 100, volume: 0.25, type: 'sine' }), 150) // E5
}

/**
 * Som de erro
 */
export function playError() {
  playTone({ frequency: 220, duration: 200, volume: 0.25, type: 'sine' }) // A3
}
