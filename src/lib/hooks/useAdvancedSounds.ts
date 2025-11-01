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
import {
  playHorn,
  playFanfare,
  playExplosion,
  playDing,
  playErrorBeep,
  playLaser,
  playPowerUpGamified,
  playVictory,
  playCountdown,
  playSwirl,
  playChime,
  playBuzz,
  playGlitch,
  playWhoosh,
  playAscending,
  playBossBattle
} from '@/lib/audio/advancedSoundGenerator'

// Sons básicos
export type BasicSoundType = 'quest-complete' | 'phase-start' | 'phase-end' | 'power-up' | 'points-update' | 'notification'

// Sons avançados/impactantes
export type AdvancedSoundType =
  | 'horn'
  | 'fanfare'
  | 'explosion'
  | 'ding'
  | 'error-beep'
  | 'laser'
  | 'power-up-gamified'
  | 'victory'
  | 'countdown'
  | 'swirl'
  | 'chime'
  | 'buzz'
  | 'glitch'
  | 'whoosh'
  | 'ascending'
  | 'boss-battle'

export type SoundType = BasicSoundType | AdvancedSoundType

interface SoundConfig {
  volume: number
  enabled: boolean
}

const BASIC_SOUND_FUNCTIONS: Record<BasicSoundType, () => void> = {
  'quest-complete': playQuestComplete,
  'phase-start': playPhaseStart,
  'phase-end': playPhaseEnd,
  'power-up': playPowerUp,
  'points-update': playPointsUpdate,
  'notification': playNotification
}

const ADVANCED_SOUND_FUNCTIONS: Record<AdvancedSoundType, () => void> = {
  'horn': playHorn,
  'fanfare': playFanfare,
  'explosion': playExplosion,
  'ding': playDing,
  'error-beep': playErrorBeep,
  'laser': playLaser,
  'power-up-gamified': playPowerUpGamified,
  'victory': playVictory,
  'countdown': playCountdown,
  'swirl': playSwirl,
  'chime': playChime,
  'buzz': playBuzz,
  'glitch': playGlitch,
  'whoosh': playWhoosh,
  'ascending': playAscending,
  'boss-battle': playBossBattle
}

const ALL_SOUND_FUNCTIONS: Record<SoundType, () => void> = {
  ...BASIC_SOUND_FUNCTIONS,
  ...ADVANCED_SOUND_FUNCTIONS
}

export function useAdvancedSounds() {
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
      const soundFunction = ALL_SOUND_FUNCTIONS[type]
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
