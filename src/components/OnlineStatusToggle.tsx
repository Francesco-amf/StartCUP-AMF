'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface OnlineStatusToggleProps {
  evaluatorName?: string
}

export default function OnlineStatusToggle({ evaluatorName }: OnlineStatusToggleProps) {
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Buscar status inicial do avaliador
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: evaluator, error: fetchError } = await supabase
          .from('evaluators')
          .select('is_online')
          .eq('email', user.email)
          .single()

        if (fetchError) {
          console.error('Erro ao buscar status:', fetchError)
          return
        }

        setIsOnline(evaluator?.is_online || false)
      } catch (err) {
        console.error('Erro ao carregar status:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [supabase])

  const handleToggle = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/evaluator/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isOnline: !isOnline })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar status')
      }

      setIsOnline(!isOnline)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
      console.error('Erro ao toggle status:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Button
        disabled
        variant="ghost"
        className="text-white hover:bg-white/20"
      >
        ⏳ Carregando...
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-red-200 text-sm">{error}</span>
      )}
      <Button
        onClick={handleToggle}
        variant="ghost"
        className={`text-white hover:bg-white/20 flex items-center gap-2 ${
          isOnline ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}
        disabled={loading}
      >
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></span>
        {isOnline ? '🟢 Online' : '🔴 Offline'}
      </Button>
    </div>
  )
}
