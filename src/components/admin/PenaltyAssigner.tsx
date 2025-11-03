'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Team {
  id: string
  name: string
  course: string
}

interface PenaltyType {
  type: string
  name: string
  icon: string
  minDeduction: number
  maxDeduction: number
}

const PENALTY_TYPES: PenaltyType[] = [
  {
    type: 'plagio',
    name: 'Plágio',
    icon: '⚠️',
    minDeduction: 50,
    maxDeduction: 100
  },
  {
    type: 'desorganizacao',
    name: 'Desorganização',
    icon: '📌',
    minDeduction: 10,
    maxDeduction: 30
  },
  {
    type: 'desrespeito',
    name: 'Desrespeito às Regras',
    icon: '🚫',
    minDeduction: 20,
    maxDeduction: 50
  },
  {
    type: 'ausencia',
    name: 'Ausência',
    icon: '❌',
    minDeduction: 30,
    maxDeduction: 100
  },
  {
    type: 'atraso',
    name: 'Atraso na Entrega',
    icon: '⏰',
    minDeduction: 5,
    maxDeduction: 20
  }
]

export default function PenaltyAssigner() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [selectedPenalty, setSelectedPenalty] = useState<string>('')
  const [pointsDeduction, setPointsDeduction] = useState<number>(0)
  const [reason, setReason] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, name, course')
        .not('email', 'in', '("admin@test.com","avaliador1@test.com","avaliador2@test.com","avaliador3@test.com")')
        .order('name')

      if (data) {
        setTeams(data)
      }
    }

    fetchTeams()
  }, [supabase])

  const selectedPenaltyType = PENALTY_TYPES.find(p => p.type === selectedPenalty)

  const handleAssignPenalty = async () => {
    if (!selectedTeam || !selectedPenalty || pointsDeduction === 0) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/assign-penalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam,
          penaltyType: selectedPenalty,
          pointsDeduction,
          reason: reason || undefined
        })
      })

      // Verificar se sessão expirou (401/403)
      if (response.status === 401 || response.status === 403) {
        setMessage({ type: 'error', text: 'Sua sessão expirou. Redirecionando para login...' })
        setTimeout(() => {
          router.push('/login')
        }, 1000)
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atribuir penalidade')
      }

      setMessage({ type: 'success', text: data.message })
      setSelectedTeam('')
      setSelectedPenalty('')
      setPointsDeduction(0)
      setReason('')

      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-[#00E5FF] mb-4">⚖️ Atribuir Penalidade</h3>

        <div className="bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 backdrop-blur-sm border-2 border-[#00E5FF]/40 rounded-lg p-6 space-y-4">
          {/* Seleção da Equipe */}
          <div>
            <label className="block text-[#00E5FF] font-semibold mb-2">Equipe</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full bg-[#001A4D] border-2 border-[#00E5FF]/60 text-[#00E5FF] rounded-lg p-3 focus:outline-none focus:border-[#00E5FF] font-semibold"
            >
              <option value="" className="bg-[#001A4D] text-[#00E5FF]">Selecione uma equipe...</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id} className="bg-[#001A4D] text-[#00E5FF]">
                  {team.name} ({team.course})
                </option>
              ))}
            </select>
          </div>

          {/* Seleção do Tipo de Penalidade */}
          <div>
            <label className="block text-[#00E5FF] font-semibold mb-2">Tipo de Penalidade</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PENALTY_TYPES.map((penalty) => (
                <button
                  key={penalty.type}
                  onClick={() => {
                    setSelectedPenalty(penalty.type)
                    setPointsDeduction(penalty.minDeduction)
                  }}
                  className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    selectedPenalty === penalty.type
                      ? 'border-[#00E5FF] bg-[#00E5FF]/20 text-[#00E5FF]'
                      : 'border-[#00E5FF]/40 bg-[#0A1E47]/30 text-white hover:border-[#00E5FF]/70'
                  }`}
                >
                  {penalty.icon} {penalty.name}
                </button>
              ))}
            </div>
          </div>

          {/* Detalhes da Penalidade Selecionada */}
          {selectedPenaltyType && (
            <div className="bg-[#0A1E47]/50 border-l-4 border-[#00E676]/60 p-4 rounded">
              <p className="text-[#00E676] font-semibold mb-2">
                {selectedPenaltyType.icon} {selectedPenaltyType.name}
              </p>
              <p className="text-sm text-white/80">
                Intervalo de deduction: {selectedPenaltyType.minDeduction} - {selectedPenaltyType.maxDeduction} pontos
              </p>
            </div>
          )}

          {/* Dedução de Pontos */}
          {selectedPenaltyType && (
            <div>
              <label className="block text-[#00E5FF] font-semibold mb-2">
                Dedução de Pontos: {pointsDeduction} pontos
              </label>
              <input
                type="range"
                min={selectedPenaltyType.minDeduction}
                max={selectedPenaltyType.maxDeduction}
                value={pointsDeduction}
                onChange={(e) => setPointsDeduction(parseInt(e.target.value))}
                className="w-full h-2 bg-[#0A1E47]/50 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>{selectedPenaltyType.minDeduction}</span>
                <span>{selectedPenaltyType.maxDeduction}</span>
              </div>
            </div>
          )}

          {/* Motivo (Opcional) */}
          <div>
            <label className="block text-[#00E5FF] font-semibold mb-2">Motivo (Opcional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da penalidade..."
              rows={3}
              className="w-full bg-[#0A1E47]/50 border-2 border-[#00E5FF]/40 text-white rounded-lg p-3 placeholder-white/40 focus:outline-none focus:border-[#00E5FF]"
            />
          </div>

          {/* Mensagem de Feedback */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm font-semibold ${
                message.type === 'success'
                  ? 'bg-[#00E676]/20 border-l-4 border-[#00E676] text-[#00E676]'
                  : 'bg-[#FF6B6B]/20 border-l-4 border-[#FF6B6B] text-[#FF6B6B]'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Botão de Atribuição */}
          <Button
            onClick={handleAssignPenalty}
            disabled={!selectedTeam || !selectedPenalty || pointsDeduction === 0 || loading}
            className="w-full bg-[#FF3D00] hover:bg-[#FF6B6B] text-white font-bold py-3"
          >
            {loading ? '⏳ Atribuindo...' : '⚖️ Atribuir Penalidade'}
          </Button>
        </div>
      </div>
    </div>
  )
}
