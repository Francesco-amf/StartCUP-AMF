'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAudioFiles } from '@/lib/hooks/useAudioFiles'
import { usePowerUpStatus } from '@/lib/hooks/usePowerUpStatus'

interface PowerUpOption {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

const POWER_UPS: PowerUpOption[] = [
  {
    id: 'mentor_session',
    name: 'Mentoria de 15min',
    icon: '👨‍🏫',
    description: 'Sessão de mentoria com um especialista por 15 minutos',
    color: 'blue'
  },
  {
    id: 'instant_feedback',
    name: 'Feedback Instantâneo',
    icon: '⚡',
    description: 'Receba feedback imediato sobre sua entrega atual',
    color: 'purple'
  },
  {
    id: 'checkpoint_review',
    name: 'Checkpoint Extra',
    icon: '✅',
    description: 'Ganhe um checkpoint extra com revisão de entrega',
    color: 'yellow'
  },
  {
    id: 'revision_session',
    name: 'Sessão de Revisão',
    icon: '🔍',
    description: 'Revise sua solução com orientação especializada',
    color: 'red'
  }
]

export default function PowerUpActivator() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { play } = useAudioFiles()

  // Use o novo hook que gerencia corretamente o estado dos power-ups por fase
  const { canUse, usedPowerUp, currentPhase } = usePowerUpStatus()

  const handleActivatePowerUp = async (powerUpType: string) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const maxRetries = 3
    let lastError = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('/api/power-ups/activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ powerUpType })
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Erro ao ativar power-up')
          setIsLoading(false)
          return
        }

        setSuccess(true)

        // Tocar som de power-up ativado
        play('power-up')

        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => {
          setSuccess(false)
        }, 3000)

        setIsLoading(false)
        return
      } catch (err) {
        lastError = err
        // Se não é o último attempt, aguarda e tenta novamente
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    setError('Erro ao ativar power-up. Tente novamente.')
    console.error('Erro após múltiplas tentativas:', lastError)
    setIsLoading(false)
  }

  // Não mostrar power-ups na fase 0 (evento ainda não começou)
  if (currentPhase === 0 || currentPhase === null) {
    return null
  }

  if (!canUse && !usedPowerUp) {
    return null
  }

  return (
    <Card className="p-2 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40 w-full overflow-hidden">
      <div className="mb-2">
        <h2 className="text-xs font-bold text-[#00E5FF]">⚡ Power-ups (Fase {currentPhase})</h2>
        <p className="text-xs text-[#00E5FF]/70 line-clamp-1">
          {canUse
            ? 'Escolha um power-up'
            : `Já usou: ${POWER_UPS.find(p => p.id === usedPowerUp)?.name}`}
        </p>
      </div>

      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-2 p-2 bg-green-50 border border-green-200 text-green-700 rounded text-xs">
          ✅ Ativado!
        </div>
      )}

      {canUse ? (
        <div className="grid grid-cols-2 gap-2">
          {POWER_UPS.map((powerUp) => (
            <div
              key={powerUp.id}
              className="bg-gradient-to-br from-[#0A1E47]/50 to-[#001A4D]/50 border-2 border-[#00E5FF]/40 rounded-lg p-2 flex flex-col justify-between"
            >
              <div className="flex gap-2 flex-1 items-start">
                <span className="text-lg flex-shrink-0">{powerUp.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#00E5FF] text-xs line-clamp-2">{powerUp.name}</h3>
                </div>
              </div>
              <Button
                onClick={() => handleActivatePowerUp(powerUp.id)}
                disabled={isLoading}
                className="mt-0.5 w-full h-5 text-xs bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-[#0A1E47] font-bold"
                size="sm"
                variant="default"
              >
                ⚡ Ativar
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-2 bg-gradient-to-r from-[#0A1E47]/50 to-[#001A4D]/50 border-l-4 border-[#FF3D00] rounded text-xs text-[#FF3D00]">
          ⚠️ Usado nesta fase
        </div>
      )}
    </Card>
  )
}
