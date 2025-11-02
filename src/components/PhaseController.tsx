'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface PhaseControllerProps {
  currentPhase: number
  eventStarted: boolean
}

export default function PhaseController({ currentPhase, eventStarted }: PhaseControllerProps) {
  const [isLoading, setIsLoading] = useState(false)
  // Usa currentPhase do servidor, que é atualizado a cada clique
  // Reflete sempre o estado real do banco de dados
  const activePhase = currentPhase

  const phases = [
    { id: 0, name: 'Preparação', icon: '⏸️', color: 'bg-[#0A1E47] border-[#00E5FF]' },
    { id: 1, name: 'Fase 1: Descoberta', icon: '🔍', color: 'bg-[#0A3A5A] border-[#00D4FF]', duration: '2h30min', points: 200 },
    { id: 2, name: 'Fase 2: Criação', icon: '💡', color: 'bg-[#1B4A7F] border-[#0077FF]', duration: '3h30min', points: 300 },
    { id: 3, name: 'Fase 3: Estratégia', icon: '📊', color: 'bg-[#1B5A3F] border-[#00FF88]', duration: '2h30min', points: 200 },
    { id: 4, name: 'Fase 4: Refinamento', icon: '✨', color: 'bg-[#5A5A0A] border-[#FFD700]', duration: '2h', points: 150 },
    { id: 5, name: 'Fase 5: Pitch Final', icon: '🎯', color: 'bg-[#5A0A0A] border-[#FF6B6B]', duration: '1h30min', points: 150 },
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
        console.error('API Error Response:', {
          status: response.status,
          error: data.error,
          details: data.details,
          code: data.code,
          hint: data.hint
        })
        throw new Error(
          data.details
            ? `${data.error}: ${data.details}`
            : data.error || 'Erro ao atualizar fase'
        )
      }

      alert(`✅ ${data.message}`)
      // Recarrega a página para obter os dados atualizados do banco
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
              ${activePhase === p.id
                ? 'border-[#00FF88] bg-[#0A1E47]/80 shadow-lg shadow-[#00FF88]/40'
                : 'border-[#00E5FF]/40 bg-[#0A1E47]/40'}
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <h4 className="font-bold text-sm text-white">{p.name}</h4>
                  {p.duration && (
                    <p className="text-xs text-[#00E5FF]/70">⏱️ {p.duration}</p>
                  )}
                </div>
              </div>
              {activePhase === p.id && (
                <span className="bg-[#00FF88] text-[#0A1E47] text-xs px-2 py-1 rounded-full font-bold">
                  ✓ ATIVA
                </span>
              )}
            </div>

            {p.points && (
              <div className="text-xs text-[#FFD700] mb-3">
                💎 {p.points} pontos totais
              </div>
            )}

            <Button
              onClick={() => handleStartPhase(p.id)}
              disabled={isLoading || activePhase === p.id}
              className={`w-full text-white font-bold hover:opacity-90 ${p.color}`}
              size="sm"
            >
              {activePhase === p.id ? '✓ Fase Atual' : `Ativar ${p.icon}`}
            </Button>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40 rounded-lg p-4 text-sm">
        <p className="font-semibold text-[#00E5FF] mb-3">🚀 Como Começar o Evento:</p>
        <ol className="list-decimal list-inside text-[#00E5FF]/80 space-y-2 mb-3">
          <li><span className="font-bold">Clique em "Ativar"</span> em qualquer fase (Fase 1, 2, 3, 4 ou 5)</li>
          <li>O evento começará imediatamente naquela fase</li>
          <li>O cronômetro oficial inicia quando você ativar a primeira fase</li>
          <li>Os times e avaliadores verão qual fase está ativa em tempo real</li>
        </ol>

        <p className="font-semibold text-[#FF9800] mb-2">⏸️ Como Navegar Entre Fases:</p>
        <ul className="list-disc list-inside text-[#FF9800]/80 space-y-1">
          <li>Clique em outra fase para mudar durante o evento</li>
          <li>Voltar para <span className="font-bold text-red-400">"Preparação"</span> encerra o evento completamente</li>
        </ul>
      </div>
    </div>
  )
}
