'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface PhaseControllerProps {
  currentPhase: number
  eventStarted: boolean
}

export default function PhaseController({ currentPhase, eventStarted }: PhaseControllerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [phase, setPhase] = useState(currentPhase)

  const phases = [
    { id: 0, name: 'Preparação', icon: '⏸️', color: 'bg-gray-500' },
    { id: 1, name: 'Fase 1: Descoberta', icon: '🔍', color: 'bg-blue-600', duration: '2h30min', points: 200 },
    { id: 2, name: 'Fase 2: Criação', icon: '💡', color: 'bg-purple-600', duration: '3h30min', points: 300 },
    { id: 3, name: 'Fase 3: Estratégia', icon: '📊', color: 'bg-green-600', duration: '2h30min', points: 200 },
    { id: 4, name: 'Fase 4: Refinamento', icon: '✨', color: 'bg-yellow-600', duration: '2h', points: 150 },
    { id: 5, name: 'Fase 5: Pitch Final', icon: '🎯', color: 'bg-red-600', duration: '1h30min', points: 150 },
  ]

  const handleStartPhase = async (phaseId: number) => {
    if (phaseId === 0 && eventStarted) {
      const confirm = window.confirm(
        '⚠️ ATENÇÃO: Isso vai ENCERRAR o evento!\n\n' +
        'Deseja realmente voltar para o modo de Preparação?\n\n' +
        'Esta ação marca o evento como finalizado.'
      )
      if (!confirm) return
    }

    if (phaseId > 0 && !eventStarted) {
      const confirm = window.confirm(
        `🚀 INICIAR STARTCUP AMF\n\n` +
        `Deseja iniciar o evento na ${phases[phaseId].name}?\n\n` +
        `O cronômetro oficial será iniciado agora!`
      )
      if (!confirm) return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/start-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: phaseId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar fase')
      }

      setPhase(phaseId)
      alert(`✅ ${data.message}`)
      window.location.reload()
    } catch (error) {
      console.error('Erro:', error)
      alert(`❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {phases.map((p) => (
          <div
            key={p.id}
            className={`
              border-2 rounded-xl p-4 transition-all
              ${phase === p.id ? 'border-purple-500 bg-purple-50 shadow-lg' : 'border-gray-200 bg-white'}
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <h4 className="font-bold text-sm">{p.name}</h4>
                  {p.duration && (
                    <p className="text-xs text-gray-600">⏱️ {p.duration}</p>
                  )}
                </div>
              </div>
              {phase === p.id && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  ATIVA
                </span>
              )}
            </div>

            {p.points && (
              <div className="text-xs text-gray-600 mb-3">
                💎 {p.points} pontos totais
              </div>
            )}

            <Button
              onClick={() => handleStartPhase(p.id)}
              disabled={isLoading || phase === p.id}
              className={`w-full ${p.color} hover:opacity-90`}
              size="sm"
            >
              {phase === p.id ? '✓ Fase Atual' : `Iniciar ${p.icon}`}
            </Button>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="font-semibold text-blue-900 mb-2">ℹ️ Instruções:</p>
        <ul className="list-disc list-inside text-blue-800 space-y-1">
          <li>Clique no botão da fase para ativá-la</li>
          <li>O cronômetro oficial inicia ao ativar a Fase 1</li>
          <li>As equipes verão qual fase está ativa em tempo real</li>
          <li>Voltar para "Preparação" encerra o evento</li>
        </ul>
      </div>
    </div>
  )
}
