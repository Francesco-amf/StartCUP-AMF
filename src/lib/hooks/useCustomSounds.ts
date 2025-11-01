'use client'

import { useEffect, useState } from 'react'
import {
  playCustomSuccess,
  playCustomUrgent,
  playCustomTransition,
  playCustomConfirm,
  playCustomError,
  playCustomNotify,
  playCustomProgress,
  playCustomRetro,
  playCustomDefeat,
  playCustomCountdown
} from '@/lib/audio/customSoundGenerator'

export type CustomSoundType =
  | 'success'
  | 'urgent'
  | 'transition'
  | 'confirm'
  | 'error'
  | 'notify'
  | 'progress'
  | 'retro'
  | 'defeat'
  | 'countdown'

interface SoundConfig {
  volume: number
  enabled: boolean
}

const CUSTOM_SOUND_FUNCTIONS: Record<CustomSoundType, () => void> = {
  'success': playCustomSuccess,
  'urgent': playCustomUrgent,
  'transition': playCustomTransition,
  'confirm': playCustomConfirm,
  'error': playCustomError,
  'notify': playCustomNotify,
  'progress': playCustomProgress,
  'retro': playCustomRetro,
  'defeat': playCustomDefeat,
  'countdown': playCustomCountdown
}

export function useCustomSounds() {
  const [soundConfig, setSoundConfig] = useState<SoundConfig>({
    volume: 0.7,
    enabled: true
  })

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    const savedConfig = localStorage.getItem('soundConfig')
    if (savedConfig) {
      try {
        setSoundConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.log('Could not load sound config:', error)
      }
    }
  }, [])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('soundConfig', JSON.stringify(soundConfig))
    }
  }, [soundConfig, isClient])

  const play = (type: CustomSoundType) => {
    if (!isClient || !soundConfig.enabled) return

    try {
      const soundFunction = CUSTOM_SOUND_FUNCTIONS[type]
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
