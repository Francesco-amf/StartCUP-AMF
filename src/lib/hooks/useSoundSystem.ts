'use client'

import { useEffect, useState, useCallback } from 'react'
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
   */
  const play = useCallback((type: AudioFileType, priority?: number) => {
    console.log(`📞 [useSoundSystem.play] Chamado com tipo: "${type}", prioridade: ${priority}`)
    console.log(`   Config atual:`, { enabled: soundConfig.enabled, volume: soundConfig.volume })

    // Verificar se áudio está ativado
    if (!soundConfig.enabled) {
      console.warn(`🔇 [useSoundSystem.play] Áudio desabilitado! Som "${type}" não será tocado.`)
      return
    }

    // Para penalty especificamente, usar fallback synthesized
    if (type === 'penalty') {
      console.log(`🎵 [useSoundSystem] Attempting to play sound: ${type}`)
      audioManager.playFile(type, priority).catch((err: any) => {
        console.warn(`⚠️ Penalty.mp3 falhou, usando fallback synthesized...`, err)

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

          console.log('🔊 Penalty fallback synthesized tocando...')
        })
      })
    } else if (type === 'evaluator-online' || type === 'evaluator-offline') {
      // 🟢 / 🔴 Sons dos avaliadores com logging específico
      console.log(`🎵 [useSoundSystem] Tocando som do avaliador: ${type}`)
      playFile(type, priority)
    } else {
      // Para outros sons, só tenta o arquivo
      console.log(`🎵 [useSoundSystem] Tocando som padrão: ${type}`)
      playFile(type, priority)
    }
  }, [soundConfig.enabled])

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
