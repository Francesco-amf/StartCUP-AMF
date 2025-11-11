/**
 * Gerenciador centralizado de áudio
 * Controla volume, fila de reprodução e sincronização
 * Funciona com AMBOS: arquivos de áudio e sons sintetizados
 */

import {
  getAudioContext,
  authorizeAudioContext,
  createGainNode,
  getAudioDestination,
  resumeAudioContext,
  setupAutoAudioAuthorization
} from './audioContext'

export interface SoundConfig {
  volume: number
  enabled: boolean
}

// Tipos apenas para arquivos que EXISTEM
export type AudioFileType =
  | 'boss-spawn'
  | 'coins'
  | 'evaluator-offline'
  | 'evaluator-online'
  | 'event-start'
  | 'mentor-purchase'
  | 'penalty'
  | 'phase-start'
  | 'power-up'
  | 'quest-complete'
  | 'quest-start'
  | 'ranking-down'
  | 'ranking-up'
  | 'submission'
  | 'submission-evaluated'

// Mapeamento de sons para arquivos MP3/WAV que existem no /public/sounds
const AUDIO_FILES: Record<AudioFileType, string> = {
  'boss-spawn': '/sounds/boss-spawn.wav',
  'coins': '/sounds/coins.wav',
  'evaluator-offline': '/sounds/evaluator-offline.wav',
  'evaluator-online': '/sounds/evaluator-online.wav',
  'event-start': '/sounds/event-start.mp3',
  'mentor-purchase': '/sounds/mentor-purchase.wav', // Som específico para mentoria comprada
  'penalty': '/sounds/penalty.mp3',
  'phase-start': '/sounds/phase-start.mp3',
  'power-up': '/sounds/power-up.wav', // Som para power-up ativado
  'quest-complete': '/sounds/quest-complete.mp3',
  'quest-start': '/sounds/quest-start.mp3',
  'ranking-down': '/sounds/ranking-down.wav',
  'ranking-up': '/sounds/ranking-up.mp3',
  'submission': '/sounds/submission.mp3',
  'submission-evaluated': '/sounds/quest-complete.mp3' // Som quando entrega é avaliada
}

// Volumes específicos por tipo de som (multiplicador do volume geral)
const AUDIO_VOLUMES: Record<AudioFileType, number> = {
  'boss-spawn': 1.0,          // Máximo (épico)
  'coins': 0.95,              // Bem audível (aumentado de 0.7)
  'evaluator-offline': 0.6,   // Discreto
  'evaluator-online': 0.6,    // Discreto
  'event-start': 1.0,         // Máximo (épico)
  'mentor-purchase': 1.0,     // Máximo (épico/festivo)
  'penalty': 0.95,            // Bem audível (alerta)
  'phase-start': 0.9,         // Alto
  'power-up': 0.9,            // Alto (importante)
  'quest-complete': 0.85,     // Alto
  'quest-start': 0.85,        // Alto
  'ranking-down': 0.7,        // Moderado
  'ranking-up': 0.85,         // Alto
  'submission': 0.75,         // Moderado
  'submission-evaluated': 0.85 // Alto (feedback importante)
}

// Prioridade dos sons (0 = highest priority, 10 = lowest)
// Quando avaliador conclui: quest-complete → coins → ranking-up
const AUDIO_PRIORITIES: Record<AudioFileType, number> = {
  'boss-spawn': 2,              // Alta prioridade (evento importante)
  'coins': 4,                   // Prioridade média (feedback de ganho)
  'evaluator-offline': 8,       // Baixa prioridade (informacional)
  'evaluator-online': 8,        // Baixa prioridade (informacional)
  'event-start': 0,             // MÁXIMA PRIORIDADE (início do evento)
  'mentor-purchase': 3,         // Alta prioridade (ação custosa)
  'penalty': 3,                 // Alta prioridade (alerta)
  'phase-start': 0,             // MÁXIMA PRIORIDADE (mudança de fase)
  'power-up': 2,                // Alta prioridade (ação importante)
  'quest-complete': 1,          // MUITO ALTA PRIORIDADE (conclusão de quest)
  'quest-start': 5,             // Prioridade média-baixa
  'ranking-down': 6,            // Prioridade média-baixa
  'ranking-up': 3,              // Prioridade média-alta (feedback importante)
  'submission': 6,              // Prioridade média-baixa
  'submission-evaluated': 1     // MUITO ALTA PRIORIDADE (conclusão importante)
}

// Interface para sons na fila com prioridade
interface QueuedSound {
  type: 'file' | 'synth'
  id: string
  duration: number
  callback: () => Promise<void>
  priority: number // 0 = highest priority, higher = lower priority
  timestamp: number // Para quebrar empates
}

class AudioManager {
  private static instance: AudioManager | null = null
  private config: SoundConfig = { volume: 0.7, enabled: true }
  private audioCache: Map<AudioFileType, HTMLAudioElement> = new Map()
  private soundQueue: QueuedSound[] = []
  private isPlaying = false
  private masterGainNode: GainNode | null = null
  private listeners: Set<(config: SoundConfig) => void> = new Set()
  private lastPlayTime = 0
  private GAP_BETWEEN_SOUNDS = 800 // ms entre sons
  private isClient = false

  private constructor() {
    // Detectar se estamos no cliente
    if (typeof window !== 'undefined') {
      this.isClient = true
      this.loadConfigFromStorage()
      this.setupStorageListener()
      this.setupInteractionListener()
      this.initMasterGain()
      // Pré-carregar arquivos de áudio críticos (sem aguardar)
      this.preloadCriticalAudios()
      // Autorizar áudio automaticamente na primeira interação do usuário
      setupAutoAudioAuthorization()
    }
  }

  /**
   * Pré-carrega arquivos de áudio críticos para garantir disponibilidade
   */
  private preloadCriticalAudios(): void {
    const criticalAudios: AudioFileType[] = ['penalty', 'phase-start', 'quest-complete']
    criticalAudios.forEach((type) => {
      const filePath = AUDIO_FILES[type]
      if (filePath && !this.audioCache.has(type)) {
        try {
          console.log(`📥 Iniciando pré-carregamento: ${type} (${filePath})`)
          const audio = new Audio(filePath)
          audio.preload = 'auto'
          audio.volume = this.config.volume

          // Adicionar listener para detectar quando está pronto
          const handleCanPlayThrough = () => {
            console.log(`✅ Áudio pré-carregado: ${type} (duração: ${audio.duration}s, readyState: ${audio.readyState})`)
            audio.removeEventListener('canplaythrough', handleCanPlayThrough)
          }

          const handleError = (e: any) => {
            console.warn(`⚠️ Erro ao pré-carregar: ${type} -`, e.target?.error?.message || e)
            audio.removeEventListener('error', handleError)
          }

          const handleLoadedMetadata = () => {
            console.log(`📊 Metadata carregada: ${type} (duração: ${audio.duration}s)`)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
          }

          audio.addEventListener('canplaythrough', handleCanPlayThrough, { once: true })
          audio.addEventListener('error', handleError, { once: true })
          audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })

          this.audioCache.set(type, audio)

          // Trigger load
          audio.load()
        } catch (err) {
          console.warn(`⚠️ Não foi possível pré-carregar ${type}:`, err)
        }
      }
    })
  }

  /**
   * Obtém a instância única do AudioManager (Singleton)
   */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  /**
   * Inicializa nó de ganho mestre
   */
  private initMasterGain(): void {
    const ctx = getAudioContext()
    if (ctx && !this.masterGainNode) {
      this.masterGainNode = createGainNode(this.config.volume)
      if (this.masterGainNode) {
        const destination = getAudioDestination()
        if (destination) {
          this.masterGainNode.connect(destination)
        }
      }
    }
  }

  /**
   * Carrega configuração do localStorage
   */
  private loadConfigFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem('soundConfig')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.config = {
          volume: Math.max(0, Math.min(1, parsed.volume ?? 0.7)),
          enabled: parsed.enabled ?? true
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar configuração de áudio:', error)
    }
  }

  /**
   * Salva configuração no localStorage
   */
  private saveConfigToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('soundConfig', JSON.stringify(this.config))
    } catch (error) {
      console.warn('⚠️ Erro ao salvar configuração de áudio:', error)
    }
  }

  /**
   * Listener para sincronizar entre abas do navegador
   */
  private setupStorageListener(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('storage', (event) => {
      if (event.key === 'soundConfig' && event.newValue) {
        try {
          const newConfig = JSON.parse(event.newValue)
          this.config = newConfig
          this.updateMasterGain()
          this.notifyListeners()
        } catch (error) {
          console.warn('⚠️ Erro ao processar atualização de configuração:', error)
        }
      }
    })
  }

  /**
   * Autoriza áudio na primeira interação
   */
  private setupInteractionListener(): void {
    if (typeof window === 'undefined') return

    const authorize = () => {
      authorizeAudioContext()
      document.removeEventListener('click', authorize)
      document.removeEventListener('touchstart', authorize)
      document.removeEventListener('keydown', authorize)
    }

    document.addEventListener('click', authorize, { once: true })
    document.addEventListener('touchstart', authorize, { once: true })
    document.addEventListener('keydown', authorize, { once: true })
  }

  /**
   * Retorna a configuração atual
   */
  getConfig(): SoundConfig {
    return { ...this.config }
  }

  /**
   * Define volume (0-1)
   */
  setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume))
    if (this.config.volume !== clamped) {
      this.config.volume = clamped
      this.updateMasterGain()
      this.saveConfigToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Alterna ativação/desativação de sons
   */
  toggleEnabled(): void {
    this.config.enabled = !this.config.enabled
    this.saveConfigToStorage()
    this.notifyListeners()
  }

  /**
   * Define se os sons estão ativados
   */
  setEnabled(enabled: boolean): void {
    if (this.config.enabled !== enabled) {
      this.config.enabled = enabled
      this.saveConfigToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Inscreve-se a mudanças de configuração
   */
  subscribe(listener: (config: SoundConfig) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notifica todos os listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.config))
  }

  /**
   * Atualiza ganho mestre quando volume muda
   */
  private updateMasterGain(): void {
    if (!this.masterGainNode) {
      this.initMasterGain()
    }

    if (this.masterGainNode) {
      const ctx = getAudioContext()
      if (ctx) {
        this.masterGainNode.gain.setValueAtTime(this.config.volume, ctx.currentTime)
      }
    }
  }

  /**
   * Reproduz um arquivo de áudio com suporte a prioridade
   */
  async playFile(type: AudioFileType, priority?: number): Promise<void> {
    if (!this.config.enabled) return

    try {
      // Verificar se arquivo existe
      const filePath = AUDIO_FILES[type]
      if (!filePath) {
        console.warn(`⚠️ Arquivo de áudio não mapeado: ${type}`)
        return
      }

      let audio = this.audioCache.get(type)

      // Se não existe em cache, criar novo
      if (!audio) {
        audio = new Audio(filePath)
        audio.addEventListener(
          'error',
          () => {
            console.error(`❌ Erro ao carregar áudio: ${type} (${filePath})`)
          },
          { once: true }
        )
        this.audioCache.set(type, audio)
      }

      // Aplicar volume (volume geral × volume específico do som)
      const specificVolume = AUDIO_VOLUMES[type] || 1.0
      audio.volume = this.config.volume * specificVolume

      // Resetar e tocar
      audio.currentTime = 0

      // Adicionar à fila com duração real do áudio
      // ⚠️ IMPORTANTE: audio.duration pode ser NaN se não está totalmente carregado
      let duration = isNaN(audio.duration) ? 0 : audio.duration * 1000

      // Fallbacks personalizados por tipo de som
      let durationFallback = 2500 // Default
      if (type === 'boss-spawn') {
        durationFallback = 5000 // Boss-spawn geralmente é mais longo (som épico)
      } else if (type === 'phase-start' || type === 'event-start') {
        durationFallback = 10000 // Transições são sons longos
      }

      duration = duration > 0 ? duration : durationFallback

      // Usar prioridade fornecida ou obter do mapa de prioridades
      const soundPriority = priority !== undefined ? priority : AUDIO_PRIORITIES[type]
      console.log(`📀 Reproduzindo: ${type} (duração: ${duration}ms, prioridade: ${soundPriority}, readyState: ${audio.readyState})`)

      await this.enqueueSound({
        type: 'file',
        id: type,
        duration: Math.max(duration, 500), // Mínimo 500ms
        priority: soundPriority,
        timestamp: Date.now(),
        callback: async () => {
          return new Promise<void>((resolve) => {
            let timeoutHandle: ReturnType<typeof setTimeout> | null = null

            const cleanup = () => {
              if (timeoutHandle) clearTimeout(timeoutHandle)
              audio!.removeEventListener('ended', handleEnd)
              audio!.removeEventListener('error', handleError)
              audio!.removeEventListener('canplay', handleCanPlay)
            }

            const handleEnd = () => {
              cleanup()
              console.log(`✅ Áudio terminado: ${type}`)
              resolve()
            }

            const handleError = (e: Event) => {
              cleanup()
              console.warn(`⚠️ Erro ao reproduzir áudio: ${type}`, e)
              resolve()
            }

            const handleCanPlay = () => {
              audio!.removeEventListener('canplay', handleCanPlay)
              console.log(`📀 Arquivo pronto (canplay): ${type}, tocando agora...`)
              audio!.play().catch((err) => {
                console.warn(`⚠️ Falha ao tocar após canplay: ${type}`, err)
                resolve()
              })
            }

            audio!.addEventListener('ended', handleEnd, { once: true })
            audio!.addEventListener('error', handleError, { once: true })

            // Timeout como fallback (em caso de arquivo corrompido ou problema)
            timeoutHandle = setTimeout(() => {
              console.log(`⏱️ Timeout de áudio: ${type}, resolvendo...`)
              cleanup()
              resolve()
            }, Math.max(duration + 500, 3000)) // Espera duration + 500ms de margem

            // Se já está carregado, tocar imediatamente
            if (audio!.readyState >= 2) {
              // HAVE_CURRENT_DATA ou mais
              console.log(`▶️ Tocando imediatamente (readyState >= 2): ${type}`)
              audio!.play().catch((err) => {
                console.warn(`⚠️ Falha ao reproduzir áudio: ${type}`, err)
                resolve()
              })
            } else {
              // Aguardar carregamento
              console.log(`⏳ Aguardando carregamento (readyState: ${audio!.readyState}): ${type}`)
              audio!.addEventListener('canplay', handleCanPlay, { once: true })
            }
          })
        }
      })
    } catch (error) {
      console.error(`❌ Erro ao reproduzir arquivo: ${type}`, error)
    }
  }

  /**
   * Reproduz um som sintetizado (Web Audio API) com suporte a prioridade
   */
  async playSynth(
    id: string,
    duration: number,
    callback: (masterGain: GainNode | null) => void,
    priority: number = 5
  ): Promise<void> {
    if (!this.config.enabled) return

    try {
      // Autorizar contexto se necessário
      const ctx = getAudioContext()
      if (!ctx) {
        console.warn('❌ Web Audio API não disponível')
        return
      }

      if (ctx.state === 'suspended') {
        await resumeAudioContext()
      }

      // Adicionar à fila
      await this.enqueueSound({
        type: 'synth',
        id,
        duration,
        priority,
        timestamp: Date.now(),
        callback: async () => {
          return new Promise<void>((resolve) => {
            try {
              callback(this.masterGainNode)
              setTimeout(() => resolve(), duration)
            } catch (error) {
              console.error(`❌ Erro ao sintetizar som: ${id}`, error)
              resolve()
            }
          })
        }
      })
    } catch (error) {
      console.error(`❌ Erro ao reproduzir som sintetizado: ${id}`, error)
    }
  }

  /**
   * Adiciona som à fila de reprodução com suporte a prioridade
   */
  private async enqueueSound(sound: QueuedSound): Promise<void> {
    // 🎯 FILTRO AGRESSIVO: Se é som de transição, SEMPRE remover quest-start
    // Independente do que estiver tocando, transições são prioritárias
    if (sound.id === 'phase-start' || sound.id === 'event-start') {
      const beforeCount = this.soundQueue.length
      this.soundQueue = this.soundQueue.filter((s) => s.id !== 'quest-start')
      const removedCount = beforeCount - this.soundQueue.length
      if (removedCount > 0) {
        console.log(`🔥 [EnqueueSound] Som de transição (${sound.id}) detectado! Removidas ${removedCount} instância(s) de quest-start.`)
      }
    }

    // 🎯 FILTRO: Se é um boss-spawn de alta prioridade, remover quest-start também
    if (sound.id === 'boss-spawn' && sound.priority <= 2) {
      const beforeCount = this.soundQueue.length
      this.soundQueue = this.soundQueue.filter((s) => s.id !== 'quest-start')
      const removedCount = beforeCount - this.soundQueue.length
      if (removedCount > 0) {
        console.log(`🎵 [EnqueueSound] Boss-spawn detectado! Removidas ${removedCount} instância(s) de quest-start.`)
      }
    }

    this.soundQueue.push(sound)

    // Ordenar fila por prioridade (0 = máxima, 10 = mínima)
    // Em caso de empate, usar timestamp (FIFO)
    this.soundQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority // Menor prioridade vem primeiro
      }
      return a.timestamp - b.timestamp // Empate: ordem de chegada
    })

    console.log(`🎵 Som adicionado à fila: ${sound.id} (prioridade: ${sound.priority}, fila agora tem ${this.soundQueue.length} sons)`)

    // Se não está tocando, começar
    if (!this.isPlaying) {
      this.processQueue()
    }
  }

  /**
   * Processa a fila de sons
   */
  private async processQueue(): Promise<void> {
    if (this.isPlaying || this.soundQueue.length === 0) return

    this.isPlaying = true

    while (this.soundQueue.length > 0) {
      const sound = this.soundQueue.shift()
      if (!sound) break

      try {
        // Aguardar intervalo entre sons
        const timeSinceLastPlay = Date.now() - this.lastPlayTime
        if (timeSinceLastPlay < this.GAP_BETWEEN_SOUNDS) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.GAP_BETWEEN_SOUNDS - timeSinceLastPlay)
          )
        }

        // Executar som e aguardar completion
        await sound.callback()
        this.lastPlayTime = Date.now()

        // Aguardar apenas o intervalo gap (não duração, pois callback já aguardou)
        if (this.soundQueue.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.GAP_BETWEEN_SOUNDS))
        }
      } catch (error) {
        console.error(`❌ Erro ao processar som na fila: ${sound.id}`, error)
      }
    }

    this.isPlaying = false
  }

  /**
   * Limpa cache de áudio (para economizar memória)
   */
  clearCache(): void {
    this.audioCache.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
    this.audioCache.clear()
  }

  /**
   * Limpa tudo (para cleanup ao desmontar)
   */
  cleanup(): void {
    this.clearCache()
    this.soundQueue = []
    this.isPlaying = false
    // Não destruir listeners pois podem estar em múltiplos componentes
  }

  /**
   * Pausa todos os sons
   */
  pauseAll(): void {
    this.audioCache.forEach((audio) => {
      audio.pause()
    })
    this.soundQueue = []
    this.isPlaying = false
  }

  /**
   * Retorna estado atual
   */
  getState() {
    return {
      enabled: this.config.enabled,
      volume: this.config.volume,
      isPlaying: this.isPlaying,
      queueLength: this.soundQueue.length,
      cachedAudios: this.audioCache.size
    }
  }
}

// Lazy getter para instância singleton (evita inicialização no servidor)
let _audioManager: AudioManager | null = null

export function getAudioManager(): AudioManager {
  if (!_audioManager) {
    _audioManager = AudioManager.getInstance()
  }
  return _audioManager
}

// Compatibilidade: export ambas as formas de acesso
// A mais simples e segura é usar getAudioManager() diretamente
export const audioManager = new Proxy(
  {},
  {
    get: (target, prop) => {
      const manager = getAudioManager()
      const value = manager[prop as keyof AudioManager]
      // Return functions bound to the manager instance
      return typeof value === 'function' ? value.bind(manager) : value
    }
  }
) as AudioManager
