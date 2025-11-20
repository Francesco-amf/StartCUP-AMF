'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface MentorRequest {
  id: string
  team_id: string
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
  team?: {
    name: string
    course: string
  }
}

interface MentorRequestsListProps {
  mentorId: string
}

export default function MentorRequestsList({ mentorId }: MentorRequestsListProps) {
  const [requests, setRequests] = useState<MentorRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [newRequestAnimation, setNewRequestAnimation] = useState(false)
  const [responseModal, setResponseModal] = useState<{ requestId: string; action: 'accept' | 'complete' | 'cancel' } | null>(null)
  const [responseText, setResponseText] = useState('')
  const supabase = createClient()

  // Reproduzir som de notificação
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(err => console.log('Não foi possível reproduzir som:', err))
    } catch (error) {
      console.log('Som de notificação não disponível')
    }
  }

  useEffect(() => {
    // Buscar dados iniciais
    fetchRequests()
    
    // ✨ REALTIME: Configurar canal de WebSocket para atualizações instantâneas
    console.log('🔌 [MentorRequestsList] Iniciando canal Realtime para mentor:', mentorId)
    
    const channel = supabase
      .channel(`mentor_requests_${mentorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentor_requests',
          filter: `mentor_id=eq.${mentorId}`
        },
        (payload: { new: MentorRequest }) => {
          console.log('🆕 [Realtime] Nova solicitação recebida!', payload.new)
          
          // Notificação sonora
          playNotificationSound()
          
          // Animação visual
          setNewRequestAnimation(true)
          setTimeout(() => setNewRequestAnimation(false), 3000)
          
          // Notificação do navegador (se permitido)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🆘 Nova Solicitação de Mentoria!', {
              body: `Equipe aguardando sua ajuda`,
              icon: '/favicon.ico',
              tag: 'mentor-request'
            })
          }
          
          // Buscar dados completos com join de team
          fetchRequests()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mentor_requests',
          filter: `mentor_id=eq.${mentorId}`
        },
        (payload: { new: MentorRequest; old: Partial<MentorRequest> }) => {
          console.log('🔄 [Realtime] Solicitação atualizada!', payload.new)
          // Atualizar estado local diretamente para melhor performance
          setRequests(prev => 
            prev.map(req => 
              req.id === payload.new.id 
                ? { ...req, ...payload.new }
                : req
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'mentor_requests',
          filter: `mentor_id=eq.${mentorId}`
        },
        (payload: { old: { id: string } }) => {
          console.log('🗑️ [Realtime] Solicitação removida!', payload.old)
          setRequests(prev => prev.filter(req => req.id !== payload.old.id))
        }
      )
      .subscribe((status: string) => {
        console.log('📡 [Realtime] Status da conexão:', status)
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('disconnected')
        }
      })

    // Cleanup: desinscrever do canal quando componente desmontar
    return () => {
      console.log('🔌 [MentorRequestsList] Encerrando canal Realtime')
      channel.unsubscribe()
    }
  }, [mentorId])

  const fetchRequests = async () => {
    try {
      console.log('🔍 [MentorRequestsList] Buscando solicitações para mentor:', mentorId)
      
      const { data, error } = await supabase
        .from('mentor_requests')
        .select(`
          *,
          team:team_id (
            name,
            course
          )
        `)
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false })

      console.log('📦 [MentorRequestsList] Resultado da query:', { 
        mentorId, 
        data, 
        error,
        count: data?.length || 0
      })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('❌ [MentorRequestsList] Erro ao buscar solicitações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (requestId: string, mentorResponse?: string) => {
    try {
      const { error } = await supabase
        .from('mentor_requests')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          mentor_response: mentorResponse || null
        })
        .eq('id', requestId)

      if (error) throw error
      
      // Atualizar lista
      fetchRequests()
      setResponseModal(null)
      setResponseText('')
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error)
      alert('Erro ao aceitar solicitação')
    }
  }

  const handleComplete = async (requestId: string, mentorResponse?: string) => {
    try {
      const { error } = await supabase
        .from('mentor_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          mentor_response: mentorResponse || null
        })
        .eq('id', requestId)

      if (error) throw error
      
      // Atualizar lista
      fetchRequests()
      setResponseModal(null)
      setResponseText('')
    } catch (error) {
      console.error('Erro ao completar solicitação:', error)
      alert('Erro ao completar solicitação')
    }
  }

  const handleCancel = async (requestId: string, mentorResponse?: string) => {
    try {
      const { error} = await supabase
        .from('mentor_requests')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          mentor_response: mentorResponse || null
        })
        .eq('id', requestId)

      if (error) throw error
      
      // Atualizar lista
      fetchRequests()
      setResponseModal(null)
      setResponseText('')
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error)
      alert('Erro ao cancelar solicitação')
    }
  }

  const handleSubmitResponse = () => {
    if (!responseModal) return

    const { requestId, action } = responseModal
    
    if (action === 'accept') {
      handleAccept(requestId, responseText)
    } else if (action === 'complete') {
      handleComplete(requestId, responseText)
    } else if (action === 'cancel') {
      handleCancel(requestId, responseText)
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const activeRequests = requests.filter(r => r.status === 'accepted')
  const completedRequests = requests.filter(r => r.status === 'completed')

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-orange-400/40">
        <p className="text-center text-white/60">⏳ Carregando solicitações...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Indicador de Status Realtime */}
      <div className="flex items-center justify-center gap-2 text-xs">
        {realtimeStatus === 'connected' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-400">🔴 Ao vivo • Atualizações instantâneas</span>
          </div>
        )}
        {realtimeStatus === 'connecting' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            <span className="text-yellow-400">⏳ Conectando...</span>
          </div>
        )}
        {realtimeStatus === 'disconnected' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="text-red-400">⚠️ Desconectado • Verifique sua conexão</span>
          </div>
        )}
      </div>

      {/* Solicitações Pendentes */}
      <Card className={`p-6 bg-gradient-to-br from-orange-900/20 to-red-900/20 border-2 border-orange-400/40 transition-all duration-500 ${
        newRequestAnimation ? 'ring-4 ring-orange-500/50 scale-[1.02]' : ''
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-3xl ${newRequestAnimation ? 'animate-bounce' : ''}`}>🆘</span>
          <div>
            <h3 className="text-xl font-bold text-orange-400">
              Solicitações de Mentoria Pendentes
              {newRequestAnimation && (
                <span className="ml-2 text-sm animate-pulse">✨ NOVA!</span>
              )}
            </h3>
            <p className="text-sm text-orange-300/70">
              {pendingRequests.length} {pendingRequests.length === 1 ? 'equipe aguardando' : 'equipes aguardando'}
            </p>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-orange-300/60">
            <p>✅ Nenhuma solicitação pendente no momento</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-[#0A1E47]/60 border-2 border-orange-400/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-lg">{request.team?.name}</h4>
                    <p className="text-sm text-orange-300/80">{request.team?.course}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/50">
                        Fase {request.phase}
                      </Badge>
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/50">
                        {request.request_number}ª solicitação
                      </Badge>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50">
                        💰 {request.amf_coins_cost} coins
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-white/40">
                    {new Date(request.created_at).toLocaleTimeString('pt-BR')}
                  </span>
                </div>

                {request.notes && (
                  <div className="bg-white/5 border border-white/10 rounded p-3 mb-3">
                    <p className="text-xs text-[#00E5FF]/70 mb-1">📝 Observações:</p>
                    <p className="text-sm text-white/90">{request.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setResponseModal({ requestId: request.id, action: 'accept' })
                      setResponseText('')
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold"
                  >
                    ✓ Aceitar
                  </Button>
                  <Button
                    onClick={() => {
                      setResponseModal({ requestId: request.id, action: 'cancel' })
                      setResponseText('')
                    }}
                    variant="outline"
                    className="bg-red-500/20 border-red-400/40 text-red-300 hover:bg-red-500/30"
                  >
                    ✕ Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Mentorias Ativas */}
      {activeRequests.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">👨‍🏫</span>
            <div>
              <h3 className="text-xl font-bold text-[#00E5FF]">Mentorias em Andamento</h3>
              <p className="text-sm text-[#00E5FF]/70">
                {activeRequests.length} {activeRequests.length === 1 ? 'sessão ativa' : 'sessões ativas'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {activeRequests.map((request) => (
              <div
                key={request.id}
                className="bg-[#0A1E47]/60 border-2 border-[#00E5FF]/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-lg">{request.team?.name}</h4>
                    <p className="text-sm text-[#00E5FF]/80">{request.team?.course}</p>
                    <Badge className="bg-green-500/20 text-green-300 border-green-400/50 mt-2">
                      🟢 Em atendimento
                    </Badge>
                  </div>
                  <span className="text-xs text-white/40">
                    Aceita às {new Date(request.accepted_at || request.created_at).toLocaleTimeString('pt-BR')}
                  </span>
                </div>

                {request.notes && (
                  <div className="bg-white/5 border border-white/10 rounded p-3 mb-3">
                    <p className="text-xs text-[#00E5FF]/70 mb-1">📝 Observações:</p>
                    <p className="text-sm text-white/90">{request.notes}</p>
                  </div>
                )}

                <Button
                  onClick={() => {
                    setResponseModal({ requestId: request.id, action: 'complete' })
                    setResponseText('')
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold"
                >
                  ✓ Marcar como Concluída
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Histórico Recente */}
      {completedRequests.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/40 to-[#001A4D]/40 border-2 border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📜</span>
            <div>
              <h3 className="text-xl font-bold text-white/80">Histórico (Últimas {Math.min(5, completedRequests.length)})</h3>
            </div>
          </div>

          <div className="space-y-2">
            {completedRequests.slice(0, 5).map((request) => (
              <div
                key={request.id}
                className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-white/90">{request.team?.name}</p>
                  <p className="text-xs text-white/60">
                    Fase {request.phase} • {request.amf_coins_cost} coins
                  </p>
                </div>
                <Badge className="bg-gray-500/20 text-gray-300 border-gray-400/50">
                  ✓ Concluída
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal de Resposta */}
      {responseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-gradient-to-br from-[#0A1E47] to-[#001A4D] border-2 border-[#00E5FF]/40 rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <h3 className="text-2xl font-bold text-[#00E5FF] mb-2">
                {responseModal.action === 'accept' && '✅ Aceitar Mentoria'}
                {responseModal.action === 'complete' && '✓ Concluir Mentoria'}
                {responseModal.action === 'cancel' && '✕ Recusar Mentoria'}
              </h3>
              <p className="text-sm text-white/70">
                {responseModal.action === 'accept' && 'Envie uma mensagem para a equipe (opcional)'}
                {responseModal.action === 'complete' && 'Deixe um feedback final para a equipe (opcional)'}
                {responseModal.action === 'cancel' && 'Explique o motivo da recusa (opcional)'}
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder={
                  responseModal.action === 'accept' 
                    ? 'Ex: Olá! Estou disponível agora para ajudá-los. Vou até a mesa de vocês...'
                    : responseModal.action === 'complete'
                    ? 'Ex: Foi ótimo ajudá-los! Lembrem-se de focar em...'
                    : 'Ex: Infelizmente não posso atender agora, mas podem solicitar outro mentor...'
                }
                className="w-full h-32 bg-white/10 border-2 border-white/20 rounded-lg p-3 text-white placeholder:text-white/40 focus:border-[#00E5FF] focus:outline-none resize-none"
              />
              <p className="text-xs text-white/50 mt-2">
                {responseText.length}/500 caracteres
              </p>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex gap-3">
              <Button
                onClick={() => {
                  setResponseModal(null)
                  setResponseText('')
                }}
                variant="outline"
                className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitResponse}
                className={`flex-1 text-white font-bold ${
                  responseModal.action === 'accept' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    : responseModal.action === 'complete'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                }`}
              >
                {responseModal.action === 'accept' && '✓ Confirmar e Aceitar'}
                {responseModal.action === 'complete' && '✓ Confirmar e Concluir'}
                {responseModal.action === 'cancel' && '✕ Confirmar Recusa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
