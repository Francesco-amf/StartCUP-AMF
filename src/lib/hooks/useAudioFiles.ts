'use client'

import { useEffect, useState } from 'react'

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

interface SoundConfig {
  volume: number
  enabled: boolean
}

// Mapeamento de sons para arquivos MP3
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
  'phase-end': '/sounds/victory.mp3',
  'phase-start': '/sounds/notification.mp3',
  'points-update': '/sounds/click.mp3',
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
}

export function useAudioFiles() {
  const [soundConfig, setSoundConfig] = useState<SoundConfig>({
    volume: 0.7,
    enabled: true
  })

  const [isClient, setIsClient] = useState(false)

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
    if (!isClient || !soundConfig.enabled) return

    try {
      let audio = audioCache[type]

      // Se não existe em cache, criar novo
      if (!audio) {
        audio = new Audio(AUDIO_FILES[type])
        audio.volume = soundConfig.volume
        audioCache[type] = audio
      }

      // Resetar e tocar
      audio.currentTime = 0
      audio.volume = soundConfig.volume
      audio.play().catch((error) => {
        console.log(`Could not play audio ${type}:`, error)
      })
    } catch (error) {
      console.log(`Could not play audio ${type}:`, error)
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
