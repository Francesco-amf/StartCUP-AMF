'use client'

import { useSoundSystem } from '@/lib/hooks/useSoundSystem'
import { Button } from '@/components/ui/button'

export default function SoundControlPanel() {
  const { soundConfig, setVolume, toggleSounds, playFile, isClient } = useSoundSystem()

  if (!isClient) return null

  const getMuteIcon = () => (soundConfig.enabled ? '🔊' : '🔇')

  // Função para autorizar áudio (necessário devido às políticas de autoplay)
  const handleAudioAuthorization = () => {
    // Tocar sequência de sons para autorizar e testar
    const sounds = [
      { file: '/sounds/penalty.mp3', delay: 0, volume: 0.3 },
      { file: '/sounds/ranking-up.mp3', delay: 1000, volume: 0.3 },
      { file: '/sounds/ranking-down.wav', delay: 2200, volume: 0.3 }
    ]

    sounds.forEach(({ file, delay, volume }) => {
      setTimeout(() => {
        const audio = new Audio(file)
        audio.volume = volume
        audio.play().catch((err) => {
          console.log(`Could not play ${file}:`, err)
        })
      }, delay)
    })

    console.log('✅ Áudio autorizado - reproduzindo sequência de sons')
  }

  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
      {/* Authorize Audio Button */}
      <Button
        onClick={handleAudioAuthorization}
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20 text-xs whitespace-nowrap"
        title="Autorizar sons do navegador"
      >
        🎵 Autorizar
      </Button>

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
        onClick={() => playFile('quest-complete')}
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
