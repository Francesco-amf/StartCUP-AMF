'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Quest {
  id: string
  name: string
  phase_id: string
  status: 'scheduled' | 'active' | 'closed' | 'completed'
  max_points?: number
  started_at?: string
  ended_at?: string
  auto_start_enabled?: boolean
  auto_start_delay_minutes?: number
  phase?: {
    id: string
    name: string
    order_index: number
  }
}

interface Phase {
  id: string
  name: string
  order_index: number
}

interface Props {
  quests: Quest[]
  phases: Phase[]
  eventStarted: boolean
}

export default function QuestControlPanelWrapper({
  quests,
  phases,
  eventStarted
}: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [questsState, setQuestsState] = useState<Quest[]>(quests)

  const handleStartQuest = async (questId: string) => {
    try {
      setLoading(true)
      setMessage(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMessage({ type: 'error', text: 'Você precisa estar autenticado' })
        return
      }

      const { data, error } = await supabase.rpc('start_quest', {
        quest_id_param: questId,
        started_by_user_id: user.id
      })

      if (error) throw error

      // Atualizar estado local
      setQuestsState(questsState.map(q =>
        q.id === questId
          ? {
              ...q,
              status: 'active',
              started_at: new Date().toISOString()
            }
          : q
      ))

      setMessage({ type: 'success', text: 'Quest iniciada com sucesso!' })
    } catch (err) {
      console.error('Erro ao iniciar quest:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao iniciar quest'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEndQuest = async (questId: string) => {
    try {
      setLoading(true)
      setMessage(null)

      const { data, error } = await supabase.rpc('end_quest', {
        quest_id_param: questId
      })

      if (error) throw error

      // Atualizar estado local
      setQuestsState(questsState.map(q =>
        q.id === questId
          ? {
              ...q,
              status: 'closed',
              ended_at: new Date().toISOString()
            }
          : q
      ))

      setMessage({ type: 'success', text: 'Quest encerrada com sucesso!' })
    } catch (err) {
      console.error('Erro ao encerrar quest:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao encerrar quest'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!eventStarted) {
    return (
      <Card className="p-4 bg-[#FF9800]/10 border border-[#FF9800]/50">
        <p className="text-[#FF9800]">
          ⚠️ Inicie o evento para controlar as quests
        </p>
      </Card>
    )
  }

  const activeQuests = questsState.filter(q => q.status === 'active')
  const scheduledQuests = questsState.filter(q => q.status === 'scheduled')
  const closedQuests = questsState.filter(q => q.status === 'closed')

  return (
    <div className="space-y-6">
      {message && (
        <Card className={`p-4 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
          <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {message.text}
          </p>
        </Card>
      )}

      {/* Quests Ativas */}
      <div>
        <h3 className="text-lg font-semibold text-[#00FF88] mb-3 flex items-center gap-2">
          <span>🟢</span>
          Quests Ativas ({activeQuests.length})
        </h3>
        {activeQuests.length > 0 ? (
          <div className="space-y-2">
            {activeQuests.map(quest => (
              <div
                key={quest.id}
                className="p-4 bg-[#1B5A3F]/40 border border-[#00FF88]/30 rounded-lg flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-semibold text-white">{quest.name}</p>
                  <p className="text-xs text-[#00E5FF]/60">
                    {quest.phase?.name} • {quest.max_points} pontos
                  </p>
                  {quest.started_at && (
                    <p className="text-xs text-[#00FF88]/60 mt-1">
                      Iniciada: {new Date(quest.started_at).toLocaleTimeString('pt-BR')}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleEndQuest(quest.id)}
                  disabled={loading}
                  className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white font-bold px-4 py-2 ml-4"
                >
                  ⏹️ ENCERRAR
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#00E5FF]/60 text-sm italic">Nenhuma quest ativa no momento</p>
        )}
      </div>

      {/* Quests Agendadas */}
      <div>
        <h3 className="text-lg font-semibold text-[#00D4FF] mb-3 flex items-center gap-2">
          <span>⏳</span>
          Próximas Quests ({scheduledQuests.length})
        </h3>
        {scheduledQuests.length > 0 ? (
          <div className="space-y-2">
            {scheduledQuests.map(quest => (
              <div
                key={quest.id}
                className="p-4 bg-[#0B5A80]/40 border border-[#00D4FF]/30 rounded-lg flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-semibold text-white">{quest.name}</p>
                  <p className="text-xs text-[#00E5FF]/60">
                    {quest.phase?.name} • {quest.max_points} pontos
                  </p>
                  {quest.auto_start_enabled && (
                    <p className="text-xs text-[#FF9800]/60 mt-1">
                      ⚙️ Auto-start em {quest.auto_start_delay_minutes} minutos
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleStartQuest(quest.id)}
                  disabled={loading}
                  className="bg-[#00FF88] hover:bg-[#00E676] text-[#0A1E47] font-bold px-4 py-2 ml-4"
                >
                  ▶️ INICIAR
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#00E5FF]/60 text-sm italic">Nenhuma quest agendada</p>
        )}
      </div>

      {/* Quests Fechadas */}
      {closedQuests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#FFD700] mb-3 flex items-center gap-2">
            <span>🔴</span>
            Quests Fechadas ({closedQuests.length})
          </h3>
          <div className="space-y-2">
            {closedQuests.map(quest => (
              <div
                key={quest.id}
                className="p-4 bg-[#5A5A0A]/20 border border-[#FFD700]/20 rounded-lg flex items-center justify-between opacity-60"
              >
                <div className="flex-1">
                  <p className="font-semibold text-white/70">{quest.name}</p>
                  <p className="text-xs text-[#00E5FF]/40">
                    {quest.phase?.name} • {quest.max_points} pontos
                  </p>
                  {quest.ended_at && (
                    <p className="text-xs text-[#FFD700]/40 mt-1">
                      Encerrada: {new Date(quest.ended_at).toLocaleTimeString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
