'use client'

import { useEffect, useState, useRef } from 'react'

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
  | 'phase-end'
  | 'phase-start'
  | 'points-update'
  | 'event-start'
  | 'quest-start'
  | 'quest-complete'
  | 'submission'
  | 'evaluated'
  | 'penalty'
  | 'ranking-up'
  | 'ranking-down'
  | 'coins'
  | 'evaluator-online'
  | 'evaluator-offline'
  | 'boss-spawn'
  | 'audio-enabled'

interface SoundConfig {
  volume: number
  enabled: boolean
}

// Mapeamento de sons para arquivos MP3/WAV
// Coloque seus arquivos em /public/sounds/
const AUDIO_FILES: Record<AudioFileType, string> = {
  'success': '/sounds/success.mp3',
  'error': '/sounds/error.mp3',
  'warning': '/sounds/warning.mp3',
  'notification': '/sounds/notification.mp3',
  'power-up': '/sounds/power-up.mp3',
  'victory': '/sounds/victory.mp3',
  'defeat': '/sounds/defeat.mp3',
  'level-up': '/sounds/level-up.mp3',
  'click': '/sounds/click.mp3',
  'buzz': '/sounds/buzz.mp3',
  'phase-end': '/sounds/phase-end.mp3',
  'phase-start': '/sounds/phase-start.mp3',
  'points-update': '/sounds/points-update.mp3',
  'event-start': '/sounds/event-start.mp3',
  'quest-start': '/sounds/quest-start.mp3',
  'quest-complete': '/sounds/quest-complete.mp3',
  'submission': '/sounds/submission.mp3',
  'evaluated': '/sounds/evaluated.mp3',
  'penalty': '/sounds/penalty.mp3',
  'ranking-up': '/sounds/ranking-up.mp3',
  'ranking-down': '/sounds/ranking-down.wav',
  'coins': '/sounds/coins.wav',
  'evaluator-online': '/sounds/evaluator-online.wav',
  'evaluator-offline': '/sounds/evaluator-offline.wav',
  'boss-spawn': '/sounds/boss-spawn.wav',
  'audio-enabled': '/sounds/event-start.mp3',
}

// Cache de áudios para evitar recarregar
const audioCache: Record<AudioFileType, HTMLAudioElement | null> = {
  'success': null,
  'error': null,
  'warning': null,
  'notification': null,
  'power-up': null,
  'victory': null,
  'defeat': null,
  'level-up': null,
  'click': null,
  'buzz': null,
  'phase-end': null,
  'phase-start': null,
  'points-update': null,
  'event-start': null,
  'quest-start': null,
  'quest-complete': null,
  'submission': null,
  'evaluated': null,
  'penalty': null,
  'ranking-up': null,
  'ranking-down': null,
  'coins': null,
  'evaluator-online': null,
  'evaluator-offline': null,
  'boss-spawn': null,
  'audio-enabled': null,
}

export function useAudioFiles() {
  const [soundConfig, setSoundConfig] = useState<SoundConfig>({
    volume: 0.7,
    enabled: true
  })

  const [isClient, setIsClient] = useState(false)
  const audioAuthorizedRef = useRef(false)
  const audioQueueRef = useRef<{ type: AudioFileType; delay: number }[]>([])
  const isPlayingRef = useRef(false)

  // Initialize on client side
  useEffect(() => {
    setIsClient(true)

    // Load sound preferences from localStorage
    const savedConfig = localStorage.getItem('soundConfig')
    if (savedConfig) {
      try {
        setSoundConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.log('Could not load sound config:', error)
      }
    }

    // ✅ AUTORIZAÇÃO SILENCIOSA: Apenas autoriza, sem tocar som
    const authorizeAudioOnInteraction = () => {
      if (!audioAuthorizedRef.current) {
        audioAuthorizedRef.current = true
        
        // Criar um contexto de áudio silencioso para autorizar
        const audio = new Audio()
        audio.volume = 0.001
        audio.play().then(() => {
          audio.pause()
        }).catch(() => {
          // Silenciosamente ignora
        })
      }
    }

    // Registrar listeners para múltiplas formas de interação
    document.addEventListener('click', authorizeAudioOnInteraction, { once: true })
    document.addEventListener('touchstart', authorizeAudioOnInteraction, { once: true })
    document.addEventListener('keydown', authorizeAudioOnInteraction, { once: true })

    return () => {
      // Cleanup: pausar todos os áudios ao desmontar
      Object.values(audioCache).forEach(audio => {
        if (audio) {
          audio.pause()
        }
      })
    }
  }, [])

  // Save config to localStorage when it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('soundConfig', JSON.stringify(soundConfig))

      // Atualizar volume de todos os áudios em cache
      Object.values(audioCache).forEach(audio => {
        if (audio) {
          audio.volume = soundConfig.volume
        }
      })
    }
  }, [soundConfig, isClient])

  const play = (type: AudioFileType) => {
    if (!isClient || !soundConfig.enabled) {
      return
    }

    // ✅ FILA DE ÁUDIO: Se já está tocando, adiciona à fila
    if (isPlayingRef.current) {
      audioQueueRef.current.push({ type, delay: 800 })
      return
    }

    try {
      let audio = audioCache[type]

      // Se não existe em cache, criar novo
      if (!audio) {
        const filePath = AUDIO_FILES[type]
        audio = new Audio(filePath)
        audio.volume = soundConfig.volume
        audioCache[type] = audio
      }

      // Resetar e tocar
      audio.currentTime = 0
      audio.volume = soundConfig.volume
      isPlayingRef.current = true
      
      audio.play()
        .then(() => {
          // Aguardar o som terminar + 800ms de pausa
          setTimeout(() => {
            isPlayingRef.current = false
            // Tocar próximo som da fila
            if (audioQueueRef.current.length > 0) {
              const next = audioQueueRef.current.shift()
              if (next) {
                play(next.type)
              }
            }
          }, (audio.duration || 1) * 1000 + 800)
        })
        .catch(() => {
          isPlayingRef.current = false
        })
    } catch (error) {
      isPlayingRef.current = false
    }
  }

  const setVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    setSoundConfig((prev) => ({ ...prev, volume: clampedVolume }))
  }

  const toggleSounds = () => {
    setSoundConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
  }

  return {
    play,
    setVolume,
    toggleSounds,
    soundConfig,
    isClient
  }
}
