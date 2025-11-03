'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SubmissionDeadlineStatusProps {
  questId: string
  teamId: string
}

interface DeadlineInfo {
  questName: string
  deadline: Date | null
  lateWindowEnd: Date | null
  isOnTime: boolean
  isLate: boolean
  isBlocked: boolean
  minutesRemaining: number
  minutesInLateWindow: number
  plannedDeadlineMinutes: number
  lateWindowMinutes: number
}

export default function SubmissionDeadlineStatus({
  questId,
  teamId
}: SubmissionDeadlineStatusProps) {
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchDeadlineInfo = async () => {
      try {
        // Buscar informações da quest
        const { data: quest, error: questError } = await supabase
          .from('quests')
          .select('id, name, started_at, planned_deadline_minutes, late_submission_window_minutes')
          .eq('id', questId)
          .single()

        if (questError || !quest) {
          setLoading(false)
          return
        }

        if (!quest.started_at) {
          setLoading(false)
          return
        }

        // Calcular deadlines
        // NOTA: quest.started_at vem do banco em UTC (ISO 8601)
        // JavaScript Date trata strings ISO como UTC, então não há conversão necessária
        // O deadline é calculado corretamente em relação ao UTC
        const startedAt = new Date(quest.started_at + 'Z')
        const deadline = new Date(startedAt.getTime() + (quest.planned_deadline_minutes * 60 * 1000))
        const lateWindowEnd = new Date(deadline.getTime() + (quest.late_submission_window_minutes * 60 * 1000))
        const now = new Date(new Date().toISOString())

        const isOnTime = now <= deadline
        const isLate = now > deadline && now <= lateWindowEnd
        const isBlocked = now > lateWindowEnd

        const minutesRemaining = isOnTime
          ? Math.ceil((deadline.getTime() - now.getTime()) / (60 * 1000))
          : isLate
          ? Math.ceil((lateWindowEnd.getTime() - now.getTime()) / (60 * 1000))
          : 0

        const minutesInLateWindow = isLate
          ? Math.ceil((now.getTime() - deadline.getTime()) / (60 * 1000))
          : 0

                setDeadlineInfo({

                  questName: quest.name,

                  deadline,

                  lateWindowEnd,

                  isOnTime,

                  isLate,

                  isBlocked,

                  minutesRemaining,

                  minutesInLateWindow,

                  plannedDeadlineMinutes: quest.planned_deadline_minutes,

                  lateWindowMinutes: quest.late_submission_window_minutes

                })

              } catch (error) {

                console.error('Erro ao buscar informações de deadline:', error)

              } finally {

                setLoading(false)

              }

            }

        

                fetchDeadlineInfo()

        

            

        

                // Atualizar a cada 10 segundos

        

                const interval = setInterval(fetchDeadlineInfo, 10000)

        

                return () => clearInterval(interval)

        

              }, [questId, supabase])

        

            

        

                // Renderização memoizada para evitar re-renders desnecessários

        

            

        

                const renderedContent = useMemo(() => {

        

            

        

                  if (loading || !deadlineInfo) {

        

            

        

                    return null

        

            

        

                  }

    if (deadlineInfo.isBlocked) {
      return (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🚫</span>
            <span className="font-bold text-red-400">Prazo Expirado</span>
          </div>
          <p className="text-sm text-red-300">
            A janela para submissão desta quest expirou. Você não pode mais enviar uma entrega.
          </p>
        </div>
      )
    }

    if (deadlineInfo.isLate) {
      // Calcular penalidade por atraso
      const minutesLate = deadlineInfo.minutesInLateWindow
      let penalty = 0
      let penaltyCategory = ''

      if (minutesLate <= 5) {
        penalty = 5
        penaltyCategory = '0-5 minutos'
      } else if (minutesLate <= 10) {
        penalty = 10
        penaltyCategory = '5-10 minutos'
      } else {
        penalty = 15
        penaltyCategory = '10-15 minutos'
      }

      return (
        <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⏰</span>
            <span className="font-bold text-orange-400">Submissão Atrasada</span>
          </div>
          <div className="space-y-2 text-sm text-orange-300">
            <p>
              Você está {deadlineInfo.minutesInLateWindow} minutos atrasado(a).
            </p>
            <p className="font-semibold">
              Penalidade: <span className="text-red-400">-{penalty}pts</span> ({penaltyCategory})
            </p>
            <p className="text-xs text-orange-200">
              Janela de atraso: {deadlineInfo.minutesRemaining} minutos restantes
            </p>
          </div>
        </div>
      )
    }

    // isOnTime
    // Calculate total time available (planned_deadline_minutes + late_window_minutes)
    const totalMinutesAvailable = deadlineInfo.plannedDeadlineMinutes + deadlineInfo.lateWindowMinutes
    return (
      <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">✅</span>
          <span className="font-bold text-green-400">No Prazo</span>
        </div>
        <div className="space-y-2 text-sm text-green-300">
          <p className="font-semibold">
            Tempo restante para o prazo: <span className="text-green-200">{deadlineInfo.minutesRemaining} minutos</span>
          </p>
          <p className="text-xs text-green-200">
            Prazo original: {deadlineInfo.plannedDeadlineMinutes} minutos. Janela de atraso: {deadlineInfo.lateWindowMinutes} minutos.
          </p>
        </div>
      </div>
    )
  }, [loading, deadlineInfo])

  return renderedContent
}
