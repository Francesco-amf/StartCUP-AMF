'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useAudioFiles } from '@/lib/hooks/useAudioFiles'

interface Mentor {
  id: string
  name: string
  email: string
  specialty?: string
  is_online?: boolean
}

interface MentorRequestButtonProps {
  currentPhase: number
  teamCoins: number
}

export default function MentorRequestButton({ currentPhase, teamCoins }: MentorRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [cost, setCost] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()
  const { play } = useAudioFiles()

  // Buscar mentores online e calcular custo ao abrir modal
  useEffect(() => {
    if (isOpen) {
      fetchMentorsAndCost()
    }
  }, [isOpen])

  const fetchMentorsAndCost = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Buscar mentores online da tabela evaluators
      const { data: mentorsData, error: mentorsError } = await supabase
        .from('evaluators')
        .select('id, name, email, specialty, is_online')
        .eq('role', 'mentor')
        .eq('is_online', true)  // Apenas mentores online
        .order('name')

      if (mentorsError) throw mentorsError
      
      setMentors(mentorsData || [])

      // 2. Buscar custo da próxima chamada
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Usuário não autenticado')

      const response = await fetch('/api/mentor/calculate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: currentPhase })
      })

      if (!response.ok) throw new Error('Erro ao calcular custo')

      const { cost: calculatedCost } = await response.json()
      setCost(calculatedCost)

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar mentores')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestMentor = async () => {
    if (!selectedMentor) {
      setError('Selecione um mentor')
      return
    }

    if (cost && teamCoins < cost) {
      setError(`AMF Coins insuficientes! Necessário: ${cost}, Disponível: ${teamCoins}`)
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/mentor/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: selectedMentor,
          phase: currentPhase,
          notes: notes.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar mentor')
      }

      // Sucesso!
      setSuccess(data.message || 'Solicitação enviada com sucesso!')
      play('power-up') // Som de sucesso
      
      // Limpar formulário
      setSelectedMentor(null)
      setNotes('')

      // Fechar modal após 2s
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(null)
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar mentor')
    } finally {
      setIsLoading(false)
    }
  }

  // Não mostrar se fase 0
  if (currentPhase === 0) return null

  const canAfford = cost ? teamCoins >= cost : false

  return (
    <>
      {/* Botão para abrir modal */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-400 font-bold"
      >
        🆘 Chamar Mentor {cost && `(💰 ${cost} coins)`}
      </Button>

      {/* Modal customizado */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-[500px] bg-gradient-to-br from-[#0A1E47] to-[#001A4D] border-2 border-[#00E5FF]/40 rounded-lg shadow-2xl text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-[#00E5FF] mb-2">
                🆘 Solicitar Mentoria
              </h2>
              <p className="text-gray-300 text-sm">
                Escolha um mentor e descreva sua dúvida
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Custo e saldo */}
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/40 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-purple-200">Custo desta chamada:</span>
                  <span className="text-2xl font-bold text-[#FFD700]">
                    {cost ? `💰 ${cost}` : '⏳'} AMF Coins
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-200">Seu saldo:</span>
                  <span className={`text-xl font-semibold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                    💰 {teamCoins} AMF Coins
                  </span>
                </div>
                {!canAfford && cost && (
                  <p className="text-xs text-red-300 mt-2">
                    ⚠️ Faltam {cost - teamCoins} AMF Coins
                  </p>
                )}
              </div>

              {/* Lista de mentores */}
              <div className="space-y-3">
                <h3 className="font-semibold text-[#00E5FF] flex items-center gap-2">
                  <span>👨‍🏫 Mentores Disponíveis</span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-400/50">
                    {mentors.length} disponível{mentors.length !== 1 ? 'eis' : ''}
                  </Badge>
                </h3>

                {isLoading ? (
                  <p className="text-sm text-gray-400">⏳ Carregando mentores...</p>
                ) : mentors.length === 0 ? (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
                    <p className="text-sm text-yellow-200">
                      ⚠️ Nenhum mentor disponível no momento. Tente novamente em instantes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {mentors.map((mentor) => (
                      <div
                        key={mentor.id}
                        onClick={() => setSelectedMentor(mentor.id)}
                        className={`
                          p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${selectedMentor === mentor.id
                            ? 'bg-[#00E5FF]/20 border-[#00E5FF]'
                            : 'bg-white/5 border-white/10 hover:border-[#00E5FF]/50'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{mentor.name}</p>
                            {mentor.specialty && (
                              <p className="text-xs text-gray-400">{mentor.specialty}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🟢</span>
                            {selectedMentor === mentor.id && (
                              <span className="text-[#00E5FF]">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Campo de observações */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  📝 Sobre o que precisa de ajuda? (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Preciso de ajuda com validação do modelo de negócio..."
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-[#00E5FF] focus:outline-none resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {notes.length}/500 caracteres
                </p>
              </div>

              {/* Mensagens de erro/sucesso */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-400/40 rounded-lg">
                  <p className="text-sm text-red-200">❌ {error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-500/20 border border-green-400/40 rounded-lg">
                  <p className="text-sm text-green-200">✅ {success}</p>
                </div>
              )}
            </div>

            {/* Footer com botões */}
            <div className="p-6 border-t border-white/10 flex gap-3">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 border-2 border-gray-600 text-white hover:from-gray-600 hover:to-gray-700 hover:border-gray-500 font-semibold transition-all"
                disabled={isLoading}
              >
                ✕ Cancelar
              </Button>
              <Button
                onClick={handleRequestMentor}
                disabled={!selectedMentor || !canAfford || isLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ Enviando...' : `🆘 Solicitar (💰 ${cost || '?'})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
