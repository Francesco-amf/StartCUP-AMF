'use client'

import { useEffect, useState } from 'react'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'

export default function AudioAuthorizationBanner() {
  const [authorized, setAuthorized] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { isClient: soundSystemClient } = useSoundSystem()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const handleInteraction = () => {
      // Trigger audio context resume by attempting to play a sound
      try {
        const audioContext = typeof window !== 'undefined' ? (window as any).audioContext : null
        if (audioContext?.resume) {
          audioContext.resume().then(() => {
            console.log('✅ Audio context resumed after user interaction')
            setAuthorized(true)
          })
        }
      } catch (err) {
        console.log('Audio authorization triggered')
      }

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
        ${authorized
          ? 'bg-green-500/20 text-green-300 border-green-400/50'
          : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50'}
        border rounded-lg p-4 mb-6 flex items-center gap-3
      `}
      role="status"
      aria-live="polite"
      aria-label={authorized ? 'Áudio autorizado' : 'Autorizar áudio requerido'}
    >
      <span className="text-2xl flex-shrink-0">
        {authorized ? '🔊' : '🔇'}
      </span>

      <div className="flex-1">
        <p className="font-semibold text-sm">
          {authorized
            ? '✅ Áudio autorizado - Sons estão ativos!'
            : '⚠️ Para ouvir sons, clique em qualquer lugar da página'}
        </p>
        {!authorized && (
          <p className="text-xs opacity-90 mt-1">
            Isso é uma política de segurança do navegador para evitar áudio indesejado
          </p>
        )}
      </div>
    </div>
  )
}
