"use client"

import React from 'react'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'
import { getAudioManager } from '@/lib/audio/audioManager'

export default function DebugSoundTester() {
  const { play, setVolume, toggleSounds, soundConfig, getState } = useSoundSystem()

  const audioManager = getAudioManager()

  return (
    <div className="p-4 bg-white/5 rounded-md text-white">
      <h3 className="font-bold mb-2">Debug Sound Tester</h3>

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => play('penalty')}
          className="px-3 py-1 bg-red-600 rounded"
        >
          ▶️ Play Penalty
        </button>

        <button
          onClick={() => play('quest-complete')}
          className="px-3 py-1 bg-green-600 rounded"
        >
          ▶️ Play Quest Complete
        </button>

        <button
          onClick={() => toggleSounds()}
          className="px-3 py-1 bg-yellow-600 rounded"
        >
          🔁 Toggle Sounds
        </button>
      </div>

      <div className="text-sm text-gray-200">
        <p>Enabled: <strong>{String(soundConfig.enabled)}</strong></p>
        <p>Volume: <strong>{(soundConfig.volume * 100).toFixed(0)}%</strong></p>
        <p className="mt-2">AudioManager state (console):</p>
        <button
          onClick={() => console.log('AudioManager.getState():', audioManager.getState())}
          className="mt-1 px-3 py-1 bg-gray-700 rounded"
        >
          🖨️ Log State
        </button>
      </div>
    </div>
  )
}
