'use client'

import { useEffect, useState, useRef } from 'react'
import { useServerTime } from './useServerTime'

/**
 * Hook especializado para calcular tempos de quest/fase sincronizados com servidor
 *
 * Resolve o problema: Phase timer vs Quest timer desincronizados
 *
 * Uso:
 * const times = useQuestPhaseSync(phaseStartedAt, questStartedAt, questDurationMin, phaseDurationMin)
 * // times = { phaseTimeRemaining, questTimeRemaining, isPhaseExpired, isQuestExpired, isSynced }
 */

interface QuestPhaseSyncTimes {
  // Tempo restante em SEGUNDOS
  phaseTimeRemaining: number
  questTimeRemaining: number

  // Milissegundos (para cálculos precisos)
  phaseTimeRemainingMs: number
  questTimeRemainingMs: number

  // Status
  isPhaseExpired: boolean
  isQuestExpired: boolean
  isSynced: boolean

  // Debug
  serverNow: number
  phaseDeadline: number
  questDeadline: number
  phaseProgress: number // 0-100%
  questProgress: number // 0-100%
}

export function useQuestPhaseSync(
  phaseStartedAt: string | null,
  questStartedAt: string | null,
  questDurationMinutes: number = 60,
  phaseDurationMinutes: number = 360
): QuestPhaseSyncTimes {
  const { serverTime, isSynced, offset } = useServerTime()
  const [times, setTimes] = useState<QuestPhaseSyncTimes>({
    phaseTimeRemaining: 0,
    questTimeRemaining: 0,
    phaseTimeRemainingMs: 0,
    questTimeRemainingMs: 0,
    isPhaseExpired: false,
    isQuestExpired: false,
    isSynced: false,
    serverNow: 0,
    phaseDeadline: 0,
    questDeadline: 0,
    phaseProgress: 0,
    questProgress: 0
  })

  /**
   * Calcular tempos sincronizados
   * Usar serverTime como source of truth, não Date.now()
   */
  useEffect(() => {
    const calculate = () => {
      // ✅ Usar serverTime como source of truth
      const serverNow = serverTime.getTime()

      // Parsear timestamps com segurança
      let phaseStart = 0
      let questStart = 0

      if (phaseStartedAt) {
        const cleanPhase = phaseStartedAt.endsWith('Z')
          ? phaseStartedAt
          : `${phaseStartedAt}Z`
        phaseStart = new Date(cleanPhase).getTime()
      }

      if (questStartedAt) {
        const cleanQuest = questStartedAt.endsWith('Z')
          ? questStartedAt
          : `${questStartedAt}Z`
        questStart = new Date(cleanQuest).getTime()
      }

      // Calcular deadlines
      const phaseDeadline = phaseStart + (phaseDurationMinutes * 60 * 1000)
      const questDeadline = questStart + (questDurationMinutes * 60 * 1000)

      // Calcular tempo restante (em ms, depois converter para segundos)
      const phaseTimeRemainingMs = Math.max(0, phaseDeadline - serverNow)
      const questTimeRemainingMs = Math.max(0, questDeadline - serverNow)

      const phaseTimeRemaining = phaseTimeRemainingMs / 1000
      const questTimeRemaining = questTimeRemainingMs / 1000

      // Detectar expiração
      const isPhaseExpired = phaseTimeRemainingMs === 0
      const isQuestExpired = questTimeRemainingMs === 0

      // Calcular progresso (0-100%)
      const totalPhaseDurationMs = phaseDurationMinutes * 60 * 1000
      const totalQuestDurationMs = questDurationMinutes * 60 * 1000

      const phaseProgress = Math.round((1 - phaseTimeRemainingMs / totalPhaseDurationMs) * 100)
      const questProgress = Math.round((1 - questTimeRemainingMs / totalQuestDurationMs) * 100)

      setTimes({
        phaseTimeRemaining,
        questTimeRemaining,
        phaseTimeRemainingMs,
        questTimeRemainingMs,
        isPhaseExpired,
        isQuestExpired,
        isSynced,
        serverNow,
        phaseDeadline,
        questDeadline,
        phaseProgress: Math.min(100, Math.max(0, phaseProgress)),
        questProgress: Math.min(100, Math.max(0, questProgress))
      })

      // Debug logging
      if (questStartedAt) {
        console.log(`⏱️ [QuestPhaseSync] Tempos sincronizados:`, {
          serverNow: new Date(serverNow).toISOString(),
          phaseRemaining: `${Math.floor(phaseTimeRemaining / 60)}m ${Math.floor(phaseTimeRemaining % 60)}s`,
          questRemaining: `${Math.floor(questTimeRemaining / 60)}m ${Math.floor(questTimeRemaining % 60)}s`,
          phaseProgress: `${phaseProgress}%`,
          questProgress: `${questProgress}%`,
          isPhaseExpired,
          isQuestExpired,
          isSynced,
          serverOffset: `${offset > 0 ? '+' : ''}${offset.toFixed(0)}ms`
        })
      }
    }

    // Calcular imediatamente
    calculate()

    // Recalcular a cada segundo (mais preciso que antes)
    const interval = setInterval(calculate, 1000)

    return () => clearInterval(interval)
  }, [phaseStartedAt, questStartedAt, questDurationMinutes, phaseDurationMinutes, serverTime, isSynced, offset])

  return times
}
