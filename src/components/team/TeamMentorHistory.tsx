'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MentorRequest {
  id: string
  mentor_id: string
  phase: number
  amf_coins_cost: number
  request_number: number
  status: string
  notes: string | null
  mentor_response: string | null
  created_at: string
  accepted_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  mentor?: {
    name: string
    specialty?: string
  }
}

interface TeamMentorHistoryProps {
  teamId: string
}

export default function TeamMentorHistory({ teamId }: TeamMentorHistoryProps) {
  const [requests, setRequests] = useState<MentorRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchRequests()

    // Realtime: Atualizar quando mentor responder
    const channel = supabase
      .channel('team-mentor-requests')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mentor_requests',
          filter: `team_id=eq.${teamId}`
        },
        (payload: any) => {
          console.log('🔔 [TeamMentorHistory] Solicitação atualizada!', payload.new)
          setRequests(prev => 
            prev.map(req => 
              req.id === payload.new.id 
                ? { ...req, ...payload.new }
                : req
            )
          )
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [teamId])

  const fetchRequests = async () => {
    try {
      console.log('🔍 [TeamMentorHistory] Buscando mentorias para team_id:', teamId)
      
      const { data, error } = await supabase
        .from('mentor_requests')
        .select(`
          *,
          evaluators!mentor_id (
            name,
            specialty
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      console.log('📦 [TeamMentorHistory] Resultado:', { data, error, count: data?.length })

      if (error) throw error
      
      // Transformar para o formato esperado
      const transformedData = (data || []).map((request: any) => ({
        ...request,
        mentor: request.evaluators
      }))
      
      setRequests(transformedData)
    } catch (error) {
      console.error('❌ Erro ao buscar histórico de mentorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/50">
            ⏳ Aguardando resposta
          </Badge>
        )
      case 'accepted':
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-400/50">
            ✅ Aceita - Em andamento
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50">
            ✓ Concluída
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-400/50">
            ✕ Recusada
          </Badge>
        )
      default:
        return <Badge className="bg-gray-500/20">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
        <p className="text-center text-white/60">⏳ Carregando histórico...</p>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
        <div className="text-center text-white/60">
          <p className="text-4xl mb-3">📭</p>
          <p>Nenhuma mentoria solicitada ainda</p>
          <p className="text-sm text-white/40 mt-2">Use o botão "🆘 Mentoria" acima para solicitar ajuda</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📜</span>
        <div>
          <h3 className="text-xl font-bold text-[#00E5FF]">Histórico de Mentorias</h3>
          <p className="text-sm text-[#00E5FF]/70">
            {requests.length} {requests.length === 1 ? 'solicitação' : 'solicitações'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-[#0A1E47]/60 border-2 border-white/10 rounded-lg p-4 hover:border-[#00E5FF]/30 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-white text-lg">
                    👨‍🏫 {request.mentor?.name || 'Mentor'}
                  </h4>
                  {getStatusBadge(request.status)}
                </div>
                {request.mentor?.specialty && (
                  <p className="text-sm text-[#00E5FF]/70">
                    📚 {request.mentor.specialty}
                  </p>
                )}
              </div>
              <div className="text-right text-xs text-white/40">
                <p>{new Date(request.created_at).toLocaleDateString('pt-BR')}</p>
                <p>{new Date(request.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            {/* Info badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50">
                Fase {request.phase}
              </Badge>
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/50">
                {request.request_number}ª solicitação
              </Badge>
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/50">
                💰 {request.amf_coins_cost} coins
              </Badge>
            </div>

            {/* Sua observação */}
            {request.notes && (
              <div className="bg-white/5 border border-white/10 rounded p-3 mb-3">
                <p className="text-xs text-white/60 mb-1">📝 Sua observação:</p>
                <p className="text-sm text-white/90">{request.notes}</p>
              </div>
            )}

            {/* Resposta do Mentor */}
            {request.mentor_response && (
              <div className={`border-2 rounded p-3 ${
                request.status === 'cancelled' 
                  ? 'bg-red-500/10 border-red-400/40'
                  : request.status === 'completed'
                  ? 'bg-blue-500/10 border-blue-400/40'
                  : 'bg-green-500/10 border-green-400/40'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {request.status === 'cancelled' ? '💬' : '✨'}
                  </span>
                  <p className="text-xs font-semibold text-white/80">
                    Resposta do mentor:
                  </p>
                </div>
                <p className="text-sm text-white/95 leading-relaxed">
                  {request.mentor_response}
                </p>
              </div>
            )}

            {/* Status timestamps */}
            <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/40 space-y-1">
              {request.accepted_at && (
                <p>✅ Aceita em: {new Date(request.accepted_at).toLocaleString('pt-BR')}</p>
              )}
              {request.completed_at && (
                <p>✓ Concluída em: {new Date(request.completed_at).toLocaleString('pt-BR')}</p>
              )}
              {request.cancelled_at && (
                <p>✕ Recusada em: {new Date(request.cancelled_at).toLocaleString('pt-BR')}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
