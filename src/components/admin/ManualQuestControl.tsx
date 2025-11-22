'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Quest {
  id: string
  name: string
  order_index: number
  status: string
  started_at: string | null
  duration_minutes: number
  phase_id: string
}

interface Phase {
  id: string
  name: string
  order_index: number
}

export default function ManualQuestControl() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [currentPhase, setCurrentPhase] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: number }>({})

  const supabase = createClient()

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000) // Atualizar a cada 5s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Atualizar tempo restante a cada segundo
    const interval = setInterval(() => {
      const remaining: { [key: string]: number } = {}
      quests.forEach(quest => {
        if (quest.status === 'active' && quest.started_at) {
          const expiresAt = new Date(quest.started_at)
          expiresAt.setMinutes(expiresAt.getMinutes() + quest.duration_minutes)
          const now = new Date()
          const diff = Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60)
          remaining[quest.id] = diff
        }
      })
      setTimeRemaining(remaining)
    }, 1000)
    return () => clearInterval(interval)
  }, [quests])

  async function loadData() {
    const { data: eventConfig } = await supabase
      .from('event_config')
      .select('current_phase')
      .single()

    if (eventConfig) {
      setCurrentPhase(eventConfig.current_phase || 0)
    }

    const { data: phasesData } = await supabase
      .from('phases')
      .select('*')
      .order('order_index')

    if (phasesData) {
      setPhases(phasesData)
    }

    const { data: questsData } = await supabase
      .from('quests')
      .select('*')
      .order('order_index')

    if (questsData) {
      setQuests(questsData)
    }
  }

  async function activateQuest(phaseOrderIndex: number, questOrderIndex: number) {
    setLoading(true)
    setMessage(null)

    try {
      const phase = phases.find(p => p.order_index === phaseOrderIndex)
      if (!phase) throw new Error('Fase não encontrada')

      // Buscar quest para pegar duration_minutes
      const questToActivate = quests.find(q => 
        q.phase_id === phase.id && q.order_index === questOrderIndex
      )
      if (!questToActivate) throw new Error('Quest não encontrada')

      // Fechar quest anterior
      if (questOrderIndex > 1) {
        await supabase
          .from('quests')
          .update({ status: 'closed' })
          .eq('phase_id', phase.id)
          .eq('order_index', questOrderIndex - 1)
      }

      // Ativar quest com planned_deadline_minutes igual a duration_minutes
      const { error } = await supabase
        .from('quests')
        .update({
          started_at: new Date().toISOString(),
          status: 'active',
          planned_deadline_minutes: questToActivate.duration_minutes
        })
        .eq('phase_id', phase.id)
        .eq('order_index', questOrderIndex)

      if (error) throw error

      setMessage({ text: `Quest ${phaseOrderIndex}.${questOrderIndex} ativada!`, type: 'success' })
      await loadData()
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function closeCurrentQuest() {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('quests')
        .update({ status: 'closed' })
        .eq('status', 'active')

      if (error) throw error

      setMessage({ text: 'Quest fechada!', type: 'success' })
      await loadData()
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function pauseQuest() {
    setLoading(true)
    setMessage(null)

    try {
      if (!activeQuest) throw new Error('Nenhuma quest ativa para pausar')

      // Calcular quanto tempo já passou
      const startedAt = new Date(activeQuest.started_at!)
      const now = new Date()
      const elapsedMinutes = Math.floor((now.getTime() - startedAt.getTime()) / 1000 / 60)

      // Armazenar tempo decorrido em um campo customizado
      const { error } = await supabase
        .from('quests')
        .update({ 
          status: 'paused',
          // Podemos usar um campo JSON para armazenar estado de pausa
        })
        .eq('id', activeQuest.id)

      if (error) throw error

      setMessage({ text: `Quest pausada! Tempo decorrido: ${elapsedMinutes}min`, type: 'success' })
      await loadData()
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function resumeQuest(questId: string, originalStartedAt: string, durationMinutes: number) {
    setLoading(true)
    setMessage(null)

    try {
      // Calcular quanto tempo já passou quando foi pausada
      const originalStart = new Date(originalStartedAt)
      const now = new Date()
      const elapsedMinutes = Math.floor((now.getTime() - originalStart.getTime()) / 1000 / 60)
      const remainingMinutes = durationMinutes - elapsedMinutes

      // Ajustar started_at para refletir tempo restante
      const newStartedAt = new Date()
      newStartedAt.setMinutes(newStartedAt.getMinutes() - elapsedMinutes)

      const { error } = await supabase
        .from('quests')
        .update({ 
          status: 'active',
          started_at: newStartedAt.toISOString()
        })
        .eq('id', questId)

      if (error) throw error

      setMessage({ text: `Quest retomada! Tempo restante: ${Math.max(0, remainingMinutes)}min`, type: 'success' })
      await loadData()
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function addTime(minutes: number) {
    setLoading(true)
    setMessage(null)

    try {
      if (!activeQuest) throw new Error('Nenhuma quest ativa')

      const currentStart = new Date(activeQuest.started_at!)
      currentStart.setMinutes(currentStart.getMinutes() - minutes) // Subtrair para adicionar tempo no final

      const { error } = await supabase
        .from('quests')
        .update({ started_at: currentStart.toISOString() })
        .eq('id', activeQuest.id)

      if (error) throw error

      setMessage({ text: `${minutes > 0 ? '+' : ''}${minutes} minutos adicionados!`, type: 'success' })
      await loadData()
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function advancePhase() {
    setLoading(true)
    setMessage(null)

    try {
      const nextPhase = currentPhase + 1
      
      // Fechar todas quests da fase atual
      const currentPhaseData = phases.find(p => p.order_index === currentPhase)
      if (currentPhaseData) {
        await supabase
          .from('quests')
          .update({ status: 'closed' })
          .eq('phase_id', currentPhaseData.id)
      }

      // Avançar fase
      await supabase
        .from('event_config')
        .update({
          current_phase: nextPhase,
          [`phase_${nextPhase}_start_time`]: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001')

      // Ativar Quest X.1 da próxima fase
      const nextPhaseData = phases.find(p => p.order_index === nextPhase)
      if (nextPhaseData) {
        await supabase
          .from('quests')
          .update({
            started_at: new Date().toISOString(),
            status: 'active'
          })
          .eq('phase_id', nextPhaseData.id)
          .eq('order_index', 1)
      }

      setMessage({ text: `Avançado para Fase ${nextPhase}!`, type: 'success' })
      await loadData()
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const currentPhaseQuests = quests.filter(q => {
    const phase = phases.find(p => p.id === q.phase_id)
    return phase?.order_index === currentPhase
  })

  const activeQuest = currentPhaseQuests.find(q => q.status === 'active')
  const pausedQuest = currentPhaseQuests.find(q => q.status === 'paused')

  return (
    <Card className="p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/30">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#00E5FF]">
        <span>🎮</span>
        Controle Manual de Quests
      </h2>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Quest Ativa */}
      {activeQuest && (
        <div className="mb-6 p-4 bg-green-500/10 border-2 border-green-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-green-400">
              ▶️ Quest Ativa: {activeQuest.name}
            </h3>
            <span className="text-2xl font-bold text-green-400">
              {timeRemaining[activeQuest.id] !== undefined 
                ? `${Math.max(0, timeRemaining[activeQuest.id])} min`
                : 'Calculando...'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => pauseQuest()}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold"
            >
              ⏸️ PAUSAR
            </Button>
            <Button
              onClick={() => addTime(10)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              +10 min
            </Button>
            <Button
              onClick={() => addTime(30)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              +30 min
            </Button>
            <Button
              onClick={() => addTime(-10)}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              -10 min
            </Button>
            <Button
              onClick={closeCurrentQuest}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              ⏹️ FECHAR
            </Button>
          </div>
        </div>
      )}

      {/* Quest Pausada */}
      {pausedQuest && (
        <div className="mb-6 p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-yellow-400">
              ⏸️ Quest Pausada: {pausedQuest.name}
            </h3>
            <span className="text-sm text-yellow-400">
              Pausada em: {pausedQuest.started_at ? new Date(pausedQuest.started_at).toLocaleTimeString('pt-BR') : '-'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => resumeQuest(pausedQuest.id, pausedQuest.started_at!, pausedQuest.duration_minutes)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              ▶️ RETOMAR
            </Button>
            <Button
              onClick={closeCurrentQuest}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              ⏹️ FECHAR
            </Button>
          </div>
        </div>
      )}

      {/* Quests da Fase Atual */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#00E5FF] mb-3">
          📋 Fase {currentPhase} - Quests Disponíveis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentPhaseQuests.map(quest => (
            <div
              key={quest.id}
              className={`p-3 rounded-lg border-2 ${
                quest.status === 'active'
                  ? 'bg-green-500/10 border-green-500/30'
                  : quest.status === 'closed'
                  ? 'bg-gray-500/10 border-gray-500/30'
                  : 'bg-blue-500/10 border-blue-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">
                  {quest.order_index}. {quest.name}
                </span>
                <span className="text-sm text-gray-400">
                  {quest.duration_minutes}min
                </span>
              </div>
              {quest.status === 'scheduled' && (
                <Button
                  onClick={() => activateQuest(currentPhase, quest.order_index)}
                  disabled={loading || !!activeQuest || !!pausedQuest}
                  className="w-full bg-[#00E5FF] hover:bg-[#00D4FF] text-[#0A1E47] font-bold"
                >
                  ▶️ ATIVAR QUEST {quest.order_index}
                </Button>
              )}
              {quest.status === 'active' && (
                <span className="text-green-400 font-semibold">✅ ATIVA</span>
              )}
              {quest.status === 'paused' && (
                <span className="text-yellow-400 font-semibold">⏸️ PAUSADA</span>
              )}
              {quest.status === 'closed' && (
                <span className="text-gray-400">🔒 Fechada</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Avançar Fase */}
      {currentPhase < 5 && (
        <div className="pt-4 border-t border-[#00E5FF]/20">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">
            ⚠️ Avançar para Próxima Fase
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Fecha todas as quests da Fase {currentPhase} e ativa Quest {currentPhase + 1}.1
          </p>
          <Button
            onClick={advancePhase}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold"
          >
            🚀 AVANÇAR PARA FASE {currentPhase + 1}
          </Button>
        </div>
      )}
    </Card>
  )
}
