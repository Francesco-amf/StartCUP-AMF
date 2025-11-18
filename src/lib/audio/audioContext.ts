/**
 * Gerenciador centralizado do Web Audio API Context
 * Garante que apenas um contexto de áudio é criado e compartilhado
 * Responsável por manter o contexto ativo e retomar quando necessário
 */

type AudioContextType = InstanceType<typeof AudioContext>

let sharedAudioContext: AudioContextType | null = null
let contextCreationAttempts = 0
const MAX_CONTEXT_ATTEMPTS = 3
let isAudioAuthorized = false
let interactionListenersAdded = false

/**
 * Obtém ou cria o contexto de áudio compartilhado
 * Implementa retry logic em caso de falha
 * IMPORTANTE: Só tenta criar após autorização do usuário
 */
export function getAudioContext(): AudioContextType | null {
  try {
    // Verificar se estamos no navegador (não no servidor)
    if (typeof window === 'undefined') {
      return null
    }

    if (!sharedAudioContext) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext

      if (!AudioContextClass) {
        return null
      }

      try {
        sharedAudioContext = new AudioContextClass()
        contextCreationAttempts = 0
      } catch (e: any) {
        // NotAllowedError: AudioContext não pode ser criado ainda (browser policy)
        // Isto é NORMAL e esperado - será retentado após autorização
        contextCreationAttempts++
        return null
      }
    }

    // Garantir que o contexto não está suspenso
    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {
        // Silenciosamente ignora - será retomado após interação
      })
    }

    return sharedAudioContext
  } catch (error) {
    // Silenciosamente ignora erros durante carregamento inicial
    contextCreationAttempts++

    if (contextCreationAttempts < MAX_CONTEXT_ATTEMPTS) {
      // Limpar e tentar novamente
      sharedAudioContext = null
      return getAudioContext()
    } else {
      return null
    }
  }
}

/**
 * Retoma o contexto de áudio após ser suspenso
 * Chamado automaticamente, mas pode ser usado manualmente se necessário
 */
export async function resumeAudioContext(): Promise<boolean> {
  const ctx = getAudioContext()
  if (!ctx) return false

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume()
      return true
    }
    return ctx.state === 'running'
  } catch (error) {
    console.error('❌ Erro ao retomar contexto de áudio:', error)
    return false
  }
}

/**
 * Autoriza áudio através de interação do usuário
 * Necessário para browsers modernos (política de autoplay)
 */
export function authorizeAudioContext(): void {
  try {
    // Tentar reproduzir um áudio silencioso para autorizar
    const audio = new Audio()
    audio.volume = 0.001
    audio.play()
      .then(() => {
        audio.pause()
        audio.currentTime = 0
      })
      .catch(() => {
        // Silenciosamente ignora falha
      })

    // Também tentar com Web Audio
    const ctx = getAudioContext()
    if (ctx) {
      resumeAudioContext().catch(() => {})
    }
  } catch (error) {
    // Silenciosamente ignora
  }
}

/**
 * Retorna o estado atual do contexto
 */
export function getAudioContextState(): 'running' | 'suspended' | 'closed' | 'unknown' {
  const ctx = getAudioContext()
  if (!ctx) return 'unknown'
  return ctx.state as 'running' | 'suspended' | 'closed'
}

/**
 * Cria um nó de ganho (volume) no contexto
 */
export function createGainNode(volume: number = 1): GainNode | null {
  const ctx = getAudioContext()
  if (!ctx) return null

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime)
  return gainNode
}

/**
 * Conexão direta ao destino (speaker)
 */
export function getAudioDestination(): AudioDestinationNode | null {
  const ctx = getAudioContext()
  return ctx ? ctx.destination : null
}

/**
 * Obtém o tempo atual do contexto para sincronização
 */
export function getCurrentAudioTime(): number {
  const ctx = getAudioContext()
  return ctx ? ctx.currentTime : 0
}

/**
 * Verifica se áudio foi autorizado pelo usuário
 */
export function isAudioAuthorizedByUser(): boolean {
  return isAudioAuthorized
}

/**
 * Auto-setup de autorização de áudio na primeira interação do usuário
 * Requer um gesto REAL do usuário (click, touch, keypress)
 * Browsers modernos não aceitam eventos sintéticos como gestos reais
 *
 * ⚠️ IMPORTANTE: A única forma de autorizar áudio em navegadores modernos
 * é através de interação genuína do usuário.
 */
export function setupAutoAudioAuthorization(): void {
  if (typeof window === 'undefined' || interactionListenersAdded) {
    return
  }

  interactionListenersAdded = true
  let authorizationAttempted = false

  const handleInteraction = (eventType: string) => {
    if (!isAudioAuthorized) {
      isAudioAuthorized = true
      authorizationAttempted = true

      // ✅ IMPORTANTE: NÃO tentar criar AudioContext aqui!
      // AudioContext NÃO pode ser criado antes de user gesture real
      // Quando audioManager.playFile() for chamado, ele criará o contexto
      // Apenas marcar como autorizado para que playFile() tente criar

      // Tentar tocar um som silencioso para pré-autorizar o HTML5 Audio API
      try {
        const audioTest = new Audio()
        audioTest.volume = 0 // Silencioso
        audioTest.src = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='
        audioTest.play().catch(() => {})
      } catch (err) {
        // Silenciosamente ignora
      }

    }
  }

  // Adicionar listeners para qualquer interação do usuário
  // ⚠️ CRÍTICO: Apenas gestos reais funcionam (click, touchstart, keydown)
  // Eventos sintéticos/simulados NÃO funcionam em navegadores modernos
  const clickHandler = () => handleInteraction('click')
  const touchHandler = () => handleInteraction('touchstart')
  const keyHandler = () => handleInteraction('keydown')

  window.addEventListener('click', clickHandler, { passive: true })
  window.addEventListener('touchstart', touchHandler, { passive: true })
  window.addEventListener('keydown', keyHandler, { passive: true })
}
