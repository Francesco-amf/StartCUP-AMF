'use client'

import { useEffect, useState } from 'react'
import {
  playQuestComplete,
  playPowerUp,
  playPhaseStart,
  playPhaseEnd,
  playPointsUpdate,
  playNotification
} from '@/lib/audio/soundGenerator'

export type SoundType = 'quest-complete' | 'phase-start' | 'phase-end' | 'power-up' | 'points-update' | 'notification'

interface SoundConfig {
  volume: number
  enabled: boolean
}

const SOUND_FUNCTIONS: Record<SoundType, () => void> = {
  'quest-complete': playQuestComplete,
  'phase-start': playPhaseStart,
  'phase-end': playPhaseEnd,
  'power-up': playPowerUp,
  'points-update': playPointsUpdate,
  'notification': playNotification
}

export function useSoundEffects() {
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
      // Cleanup if needed
    }
  }, [])

  // Save config to localStorage when it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('soundConfig', JSON.stringify(soundConfig))
    }
  }, [soundConfig, isClient])

  const play = (type: SoundType) => {
    if (!isClient || !soundConfig.enabled) return

    try {
      const soundFunction = SOUND_FUNCTIONS[type]
      if (soundFunction) {
        soundFunction()
      }
    } catch (error) {
      console.log(`Could not play sound ${type}:`, error)
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
