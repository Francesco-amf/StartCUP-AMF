'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  audioManager,
  type SoundConfig,
  type AudioFileType
} from '@/lib/audio/audioManager'
import { getAudioContext } from '@/lib/audio/audioContext'

/**
 * Hook unificado para controlar todo o sistema de áudio
 * Funciona com AMBOS: arquivos de áudio e sons sintetizados
 *
 * Uso:
 * const { play, playFile, playSynth, setVolume, toggleSounds, soundConfig } = useSoundSystem()
 *
 * // Reproduzir arquivo
 * playFile('quest-complete')
 *
 * // Reproduzir som sintetizado
 * playSynth('horn', 200, (masterGain) => {
 *   // implementação do som
 * })
 *
 * // Controlar volume
 * setVolume(0.5)
 */

export function useSoundSystem() {
  const [soundConfig, setSoundConfig] = useState<SoundConfig>({
    volume: 0.7,
    enabled: true
  })
  const soundConfigRef = useRef(soundConfig) // ✅ FIX: Store soundConfig in ref to avoid closure issues

  // Inicializar no lado do cliente
  useEffect(() => {
    // Sincronizar com estado atual do manager
    setSoundConfig(audioManager.getConfig())

    // Inscrever-se a mudanças
    const unsubscribe = audioManager.subscribe((config: SoundConfig) => {
      setSoundConfig(config)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // ✅ FIX: Update soundConfigRef whenever soundConfig changes
  useEffect(() => {
    soundConfigRef.current = soundConfig
  }, [soundConfig])

  /**
   * Reproduz um arquivo de áudio (MP3, WAV) com suporte a prioridade opcional
   */
  const playFile = (type: AudioFileType, priority?: number) => {
    audioManager.playFile(type, priority).catch((err: any) => {
      console.error(`❌ Erro ao reproduzir arquivo: ${type}`, err)
    })
  }

  /**
   * Reproduz um som sintetizado (Web Audio API)
   * Requer um callback que implemente a síntese do som
   *
   * @param id - Identificador único do som
   * @param duration - Duração em ms
   * @param callback - Função que implementa a síntese (recebe masterGainNode)
   */
  const playSynth = (
    id: string,
    duration: number,
    callback: (masterGain: GainNode | null) => void
  ) => {
    audioManager.playSynth(id, duration, callback).catch((err: any) => {
      console.error(`❌ Erro ao reproduzir som sintetizado: ${id}`, err)
    })
  }

  /**
   * Play com fallback sintetizado para penalty se arquivo falhar
   * Agora com suporte a prioridade
   * ✅ Adicionado log para debugar sons de avaliadores
   * ✅ Memoizado com useCallback para evitar re-subscrições desnecessárias em hooks dependentes
   * ✅ FIX: Usa soundConfigRef para evitar closure stale reference quando soundConfig muda
   */
  const play = useCallback((type: AudioFileType, priority?: number) => {
    // ✅ FIX: Verificar usando soundConfigRef.current em vez de closure-captured soundConfig
    if (!soundConfigRef.current.enabled) {
      console.log(`🔇 [useSoundSystem.play] Som "${type}" skipped - sounds disabled`)
      return
    }

    console.log(`🔊 [useSoundSystem.play] Tocando: "${type}" (prioridade: ${priority})`)

    // Para penalty especificamente, usar fallback synthesized
    if (type === 'penalty') {
      audioManager.playFile(type, priority).catch((err: any) => {
        console.log(`⚠️ [useSoundSystem.play] penalty fallback acionado`)
        // Fallback: buzina/aviso com síntese
        playSynth('penalty-fallback', 400, (masterGain) => {
          const ctx = getAudioContext()
          if (!ctx || !masterGain) return

          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          const now = ctx.currentTime

          // Buzina agressiva: 600Hz descendo para 200Hz em 150ms
          osc.type = 'sine'
          osc.frequency.setValueAtTime(600, now)
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.15)

          osc.connect(gain)
          gain.connect(masterGain)
          masterGain.connect(ctx.destination)

          gain.gain.setValueAtTime(0.8, now)
          gain.gain.exponentialRampToValueAtTime(0.1, now + 0.4)

          osc.start(now)
          osc.stop(now + 0.4)
        })
      })
    } else {
      playFile(type, priority)
    }
  }, [playFile]) // ✅ FIX: Adicionar playFile como dependência

  /**
   * Define volume (0-1)
   */
  const setVolume = (volume: number) => {
    audioManager.setVolume(volume)
  }

  /**
   * Alterna ativação/desativação de sons
   */
  const toggleSounds = () => {
    audioManager.toggleEnabled()
  }

  /**
   * Define se sons estão ativados
   */
  const setEnabled = (enabled: boolean) => {
    audioManager.setEnabled(enabled)
  }

  /**
   * Pausa todos os sons
   */
  const pauseAll = () => {
    audioManager.pauseAll()
  }

  /**
   * Limpa cache de áudio
   */
  const clearCache = () => {
    audioManager.clearCache()
  }

  /**
   * Retorna estado completo do sistema
   */
  const getState = () => {
    return audioManager.getState()
  }

  return {
    // Reprodução
    play,
    playFile,
    playSynth,

    // Controles
    setVolume,
    toggleSounds,
    setEnabled,
    pauseAll,
    clearCache,

    // Estado
    soundConfig,
    getState
  }
}
