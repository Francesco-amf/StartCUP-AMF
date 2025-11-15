'use client'

import { useEffect, useState } from 'react'
import { audioManager } from '@/lib/audio/audioManager'
import { authorizeAudioContext } from '@/lib/audio/audioContext'
import { Button } from './ui/button'

/**
 * Painel de debug para testes de áudio
 * Mostra estado do sistema e permite testar sons
 */
export function AudioDebugPanel() {
  const [audioState, setAudioState] = useState<any>(null)
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    // Atualizar estado imediatamente
    const updateState = () => {
      setAudioState(audioManager.getState())
    }

    updateState()

    // Atualizar a cada 100ms para capturar mudanças rápidas (sons tocando)
    const interval = setInterval(updateState, 100)

    // Também se inscrever a mudanças do audioManager
    const unsubscribe = audioManager.subscribe((config) => {
      console.log('🎵 [AudioDebugPanel] Configuração do áudio mudou:', config)
      updateState()
    })

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [])

  if (!audioState) return null

  return (
    <div className="fixed bottom-0 right-0 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="bg-blue-600 text-white px-4 py-2 rounded-tl-lg hover:bg-blue-700"
      >
        🎵 {showPanel ? 'Fechar' : 'Debug Áudio'}
      </button>

      {/* Debug Panel */}
      {showPanel && (
        <div className="bg-gray-900 text-white p-4 rounded-tl-lg max-w-md">
          <h3 className="font-bold mb-3">Estado do Áudio</h3>

          {/* Status */}
          <div className="space-y-2 text-sm mb-4 bg-gray-800 p-3 rounded">
            <div>
              <span>{audioState.enabled ? '🟢' : '🔴'}</span>{' '}
              Habilitado: <strong>{audioState.enabled ? 'SIM' : 'NÃO'}</strong>
            </div>
            <div>
              🔊 Volume: <strong>{Math.round(audioState.volume * 100)}%</strong>
            </div>
            <div>
              ▶️ Tocando: <strong className={audioState.isPlaying ? 'text-green-400' : ''}>{audioState.isPlaying ? 'SIM ✨' : 'NÃO'}</strong>
            </div>
            <div>
              📋 Fila: <strong className={audioState.queueLength > 0 ? 'text-yellow-400' : ''}>{audioState.queueLength} sons</strong>
            </div>
            <div>
              💾 Cache: <strong>{audioState.cachedAudios} áudios</strong>
            </div>
          </div>

          {/* Controles */}
          <div className="space-y-2">
            <Button
              onClick={() => {
                console.log('🔓 Autorizando áudio...')
                authorizeAudioContext()
                setTimeout(() => setAudioState(audioManager.getState()), 100)
              }}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              🔓 Autorizar Áudio
            </Button>

            {!audioState.enabled && (
              <Button
                onClick={() => {
                  audioManager.toggleEnabled()
                  setTimeout(() => setAudioState(audioManager.getState()), 100)
                }}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                ⚠️ ATIVAR SONS
              </Button>
            )}

            <Button
              onClick={() => {
                console.log('🧪 Testando: event-start')
                audioManager.playFile('event-start')
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              🧪 Testar: event-start
            </Button>

            <Button
              onClick={() => {
                console.log('🧪 Testando: phase-start')
                audioManager.playFile('phase-start')
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              🧪 Testar: phase-start
            </Button>

            <Button
              onClick={() => {
                console.log('🧪 Testando: coins')
                audioManager.playFile('coins')
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              🧪 Testar: coins
            </Button>

            <Button
              onClick={() => {
                audioManager.pauseAll()
                setTimeout(() => setAudioState(audioManager.getState()), 100)
              }}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              ⏸️ Pausar Tudo
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Abra o console (F12) para ver logs de áudio
          </p>
        </div>
      )}
    </div>
  )
}
