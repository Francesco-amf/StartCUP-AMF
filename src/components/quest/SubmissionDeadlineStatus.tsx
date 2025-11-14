'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SubmissionDeadlineStatusProps {
  questId: string
  teamId?: string
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

export default function SubmissionDeadlineStatus({ questId }: SubmissionDeadlineStatusProps) {
  const supabase = createClient()
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [nowTick, setNowTick] = useState<number>(() => Date.now())

  // Fetch deadline info initially and refresh periodically (10s)
  useEffect(() => {
    let mounted = true

  const fetchDeadlineInfo = async () => {
      try {
        const { data: quest, error } = await supabase
          .from('quests')
          .select('id, name, started_at, planned_deadline_minutes, late_submission_window_minutes')
          .eq('id', questId)
          .single()

        if (error || !quest || !mounted) {
          setLoading(false)
          return
        }

        if (!quest.started_at) {
          setLoading(false)
          return
        }

        const startedAtString: string = quest.started_at.endsWith('Z')
          ? quest.started_at
          : quest.started_at.replace('+00:00', 'Z')

  const startedMs = new Date(startedAtString).getTime()
  
  // Validar que a data é válida
  if (isNaN(startedMs)) {
    console.error('[SubmissionDeadlineStatus] Invalid started_at timestamp:', quest.started_at)
    setLoading(false)
    return
  }
  
  const planned = typeof quest.planned_deadline_minutes === 'number' ? quest.planned_deadline_minutes : null
  const late = typeof quest.late_submission_window_minutes === 'number' ? quest.late_submission_window_minutes : 0
  const deadlineMs = planned !== null ? startedMs + planned * 60_000 : Number.POSITIVE_INFINITY
  const lateEndMs = planned !== null ? deadlineMs + late * 60_000 : Number.POSITIVE_INFINITY

        const now = Date.now()
        const epsilon = 500
        const isOnTime = now <= deadlineMs + epsilon
        const isLate = now > deadlineMs + epsilon && now <= lateEndMs + epsilon
        const isBlocked = now > lateEndMs + epsilon

        const minutesRemaining = isOnTime
          ? Math.max(0, Math.ceil((deadlineMs - now) / 60_000))
          : isLate
          ? Math.max(0, Math.ceil((lateEndMs - now) / 60_000))
          : 0

        const minutesInLateWindow = isLate
          ? Math.max(0, Math.ceil((now - deadlineMs) / 60_000))
          : 0

        if (!mounted) return

        setDeadlineInfo({
          questName: quest.name,
          deadline: Number.isFinite(deadlineMs) ? new Date(deadlineMs) : null,
          lateWindowEnd: Number.isFinite(lateEndMs) ? new Date(lateEndMs) : null,
          isOnTime,
          isLate,
          isBlocked,
          minutesRemaining,
          minutesInLateWindow,
          plannedDeadlineMinutes: quest.planned_deadline_minutes,
          lateWindowMinutes: quest.late_submission_window_minutes,
        })
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDeadlineInfo()
    // Sync polling with other components (500ms in QuestAutoAdvancer + 1s in PhaseController)
    // Using 1s to avoid excessive queries while staying responsive to deadline changes
    const interval = setInterval(fetchDeadlineInfo, 1_000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [questId, supabase])

  // 1s local ticker for smooth countdown
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const content = useMemo(() => {
    if (loading || !deadlineInfo) return null

  const now = nowTick
  const hasDeadline = !!deadlineInfo.deadline
  const hasLateEnd = !!deadlineInfo.lateWindowEnd
  const deadlineMs = deadlineInfo.deadline?.getTime() ?? 0
  const lateEndMs = deadlineInfo.lateWindowEnd?.getTime() ?? 0
  
  // Validar que deadlineMs não é NaN
  if (hasDeadline && isNaN(deadlineMs)) {
    console.error('[SubmissionDeadlineStatus] Invalid deadline timestamp:', deadlineInfo.deadline)
    return (
      <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">⚠️</span>
          <span className="font-bold text-yellow-400">Erro de Configuração</span>
        </div>
        <p className="text-sm text-yellow-300">Não foi possível carregar as informações de prazo desta quest.</p>
      </div>
    )
  }
  
    const epsilon = 500

    // Se não há deadline configurado, considere "no prazo" e mostre aviso neutro
    if (!hasDeadline) {
      return (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">✅</span>
            <span className="font-bold text-green-400">No Prazo</span>
          </div>
          <div className="space-y-2 text-sm text-green-300">
            <p className="text-xs text-green-200">Prazo não configurado para esta quest. A submissão está liberada.</p>
          </div>
        </div>
      )
    }

    const isOnTime = now <= deadlineMs + epsilon
    const isLate = now > deadlineMs + epsilon && hasLateEnd && now <= lateEndMs + epsilon
    const isBlocked = hasLateEnd ? now > lateEndMs + epsilon : now > deadlineMs + epsilon

    if (isBlocked) {
      return (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🚫</span>
            <span className="font-bold text-red-400">Prazo Expirado</span>
          </div>
          <p className="text-sm text-red-300">A janela para submissão desta quest expirou. Você não pode mais enviar uma entrega.</p>
        </div>
      )
    }

    if (isLate) {
      const minutesLate = Math.max(0, Math.ceil((now - deadlineMs) / 60_000))
      let penalty = 0
      let category = ''
      if (minutesLate <= 5) { penalty = 5; category = '0-5 minutos' }
      else if (minutesLate <= 10) { penalty = 10; category = '5-10 minutos' }
      else { penalty = 15; category = '10-15 minutos' }

      return (
        <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⏰</span>
            <span className="font-bold text-orange-400">Submissão Atrasada</span>
          </div>
          <div className="space-y-2 text-sm text-orange-300">
            <p>Você está {minutesLate} minutos atrasado(a).</p>
            <p className="font-semibold">Penalidade: <span className="text-red-400">-{penalty} AMF Coins</span> ({category})</p>
            <p className="text-xs text-orange-200">Janela de atraso: {Math.max(0, Math.ceil((lateEndMs - now) / 60_000))} minutos restantes</p>
          </div>
        </div>
      )
    }

  const secondsRemaining = Math.max(0, Math.floor((deadlineMs - now) / 1000))
    const mm = Math.floor(secondsRemaining / 60)
    const ss = secondsRemaining % 60
    
    // Validação final: garantir que mm e ss não são NaN
    const displayMm = isNaN(mm) ? 0 : mm
    const displaySs = isNaN(ss) ? 0 : ss

    return (
      <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">✅</span>
          <span className="font-bold text-green-400">No Prazo</span>
        </div>
        <div className="space-y-2 text-sm text-green-300">
          <p className="font-semibold">Tempo restante para o prazo: <span className="text-green-200">{displayMm}:{String(displaySs).padStart(2,'0')}</span></p>
          <p className="text-xs text-green-200">Prazo original: {deadlineInfo.plannedDeadlineMinutes} minutos. Janela de atraso: {deadlineInfo.lateWindowMinutes} minutos.</p>
        </div>
      </div>
    )
  }, [loading, deadlineInfo, nowTick])

  return content
}

