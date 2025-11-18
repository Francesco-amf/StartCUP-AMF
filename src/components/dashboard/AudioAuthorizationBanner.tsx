'use client'

import { useEffect, useState } from 'react'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'

export default function AudioAuthorizationBanner() {
  const [authorized, setAuthorized] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { soundConfig, toggleSounds } = useSoundSystem()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const handleInteraction = () => {
      // Just mark as authorized after first user interaction
      // The audioManager already handles audio context authorization
      setAuthorized(true)

      // Remove listener after first interaction
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }

    // Add listeners for any user interaction
    window.addEventListener('click', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)
    window.addEventListener('keydown', handleInteraction)

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
  }, [isClient])

  if (!isClient) {
    return null
  }

  return (
    <div
      className={`
        transition-all duration-500 ease-in-out
        ${authorized && soundConfig.enabled
          ? 'bg-green-500/20 text-green-300 border-green-400/50'
          : authorized && !soundConfig.enabled
          ? 'bg-orange-500/20 text-orange-300 border-orange-400/50'
          : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50'}
        border rounded-lg p-4 mb-6 flex items-center gap-3 justify-between
      `}
      role="status"
      aria-live="polite"
      aria-label={authorized ? (soundConfig.enabled ? 'Áudio autorizado e ativado' : 'Áudio desativado') : 'Autorizar áudio requerido'}
    >
      <div className="flex items-center gap-3 flex-1">
        <span className="text-2xl flex-shrink-0">
          {authorized
            ? (soundConfig.enabled ? '🔊' : '🔇')
            : '🔇'}
        </span>

        <div className="flex-1">
          <p className="font-semibold text-sm">
            {!authorized
              ? '⚠️ Para ouvir sons, clique em qualquer lugar da página'
              : soundConfig.enabled
              ? '✅ Áudio autorizado - Sons estão ATIVOS!'
              : '🔇 Áudio desativado - Sons desligados'}
          </p>
          {!authorized && (
            <p className="text-xs opacity-90 mt-1">
              Clique para autorizar áudio (política de segurança do navegador)
            </p>
          )}
        </div>
      </div>

      {authorized && (
        <button
          onClick={toggleSounds}
          className={`
            px-3 py-1 rounded text-sm font-semibold whitespace-nowrap
            transition-all
            ${soundConfig.enabled
              ? 'bg-green-500/30 text-green-300 hover:bg-green-500/50'
              : 'bg-red-500/30 text-red-300 hover:bg-red-500/50'}
          `}
          title={soundConfig.enabled ? 'Desativar sons' : 'Ativar sons'}
        >
          {soundConfig.enabled ? '🔊 Desativar' : '🔇 Ativar'}
        </button>
      )}
    </div>
  )
}
