'use client'

import { useAudioFiles } from '@/lib/hooks/useAudioFiles'
import { Button } from '@/components/ui/button'

export default function SoundControlPanel() {
  const { soundConfig, setVolume, toggleSounds, play, isClient } = useAudioFiles()

  if (!isClient) return null

  const getMuteIcon = () => (soundConfig.enabled ? '🔊' : '🔇')

  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
      {/* Mute Button */}
      <Button
        onClick={toggleSounds}
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20"
        title={soundConfig.enabled ? 'Desativar sons' : 'Ativar sons'}
      >
        {getMuteIcon()}
      </Button>

      {/* Volume Slider */}
      <input
        type="range"
        min="0"
        max="100"
        value={soundConfig.enabled ? soundConfig.volume * 100 : 0}
        onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
        className="w-20 md:w-24 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
        disabled={!soundConfig.enabled}
        title="Volume dos efeitos sonoros"
      />

      {/* Volume Label */}
      <span className="text-xs md:text-sm text-purple-200 w-10">
        {Math.round(soundConfig.volume * 100)}%
      </span>

      {/* Test Sound Button */}
      <Button
        onClick={() => play('notification')}
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20 text-xs"
        disabled={!soundConfig.enabled}
        title="Testar som"
      >
        🔔
      </Button>
    </div>
  )
}
