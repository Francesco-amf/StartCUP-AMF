'use client'

import { useEffect, useState, useRef } from 'react'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'
import { setupAutoAudioAuthorization } from '@/lib/audio/audioContext'

interface TeamDashboardClientProps {
  teamId: string
  initialSubmissionsCount: number
  initialEvaluatedCount: number
}

/**
 * ✅ Componente cliente para monitorar submissões e tocar som quando avaliadas
 *
 * Usa polling a cada 2 segundos para verificar se alguma submissão foi avaliada
 * Toca "quest-complete" quando detecta nova avaliação
 */
export default function TeamDashboardClient({
  teamId,
  initialSubmissionsCount,
  initialEvaluatedCount
}: TeamDashboardClientProps) {
  const { play, playFile, getState } = useSoundSystem()
  const [lastEvaluatedCount, setLastEvaluatedCount] = useState(initialEvaluatedCount)
  const [lastEvaluatedTime, setLastEvaluatedTime] = useState<string | null>(null)

  // ✅ Initialize sound system ONCE on mount
  useEffect(() => {
    console.log('🎵 [TeamDashboardClient] Inicializando sound system...')

    // Ensure audio authorization is set up
    console.log('🎵 [TeamDashboardClient] Configurando auto audio authorization...')
    setupAutoAudioAuthorization()

    const state = getState()
    console.log('🎵 [TeamDashboardClient] Sound system state:', state)
  }, []) // ✅ Empty dependency array - run once on mount only

  // ✅ Track if we're currently checking to avoid race conditions
  const isCheckingRef = useRef(false)

  useEffect(() => {
    // ✅ Verificar se há novas avaliações a cada 2 segundos
    const pollInterval = setInterval(async () => {
      if (isCheckingRef.current) return // Evitar múltiplas requisições simultâneas

      isCheckingRef.current = true

      try {
        // ✅ Chamar API para obter contagem de submissões avaliadas
        const response = await fetch(`/api/team/check-updates?teamId=${teamId}`, {
          method: 'GET',
          cache: 'no-store'
        })

        if (!response.ok) {
          console.warn('⚠️ Erro ao verificar submissões:', response.status)
          isCheckingRef.current = false
          return
        }

        const data = await response.json()
        const evaluatedCount = data.data?.evaluatedCount || 0
        const currentEvaluatedTime = data.data?.lastEvaluatedTime

        console.log(`📊 [TeamDashboardClient] Check: avaliadas=${evaluatedCount}, última=${currentEvaluatedTime}, anterior=${lastEvaluatedTime}`)

        // ✅ Detectar se houve NOVA avaliação OU EDIÇÃO de avaliação existente
        // Caso 1: Aumento no count (primeira avaliação)
        // Caso 2: Timestamp mudou (edição de avaliação existente)
        const isNewEvaluation = evaluatedCount > lastEvaluatedCount
        const isUpdatedEvaluation = currentEvaluatedTime && lastEvaluatedTime && currentEvaluatedTime !== lastEvaluatedTime

        if (isNewEvaluation || isUpdatedEvaluation) {
          const newEvaluations = isNewEvaluation ? (evaluatedCount - lastEvaluatedCount) : 1
          console.log(`✅ [TeamDashboardClient] Detectada ${isNewEvaluation ? 'NOVA' : 'EDIÇÃO DE'} avaliação!`)

          // ✅ Tocar som para cada nova avaliação
          for (let i = 0; i < newEvaluations; i++) {
            // Delay inicial + delay entre sons para não sobrepor
            // Inicial: 500ms para garantir que som system está pronto
            const delayMs = 500 + (i * 2500)
            setTimeout(() => {
              try {
                console.log(`🔊 [TeamDashboardClient] Tocando: quest-complete para avaliação ${i + 1}`)
                const state = getState()
                console.log(`🔊 [TeamDashboardClient] Sound state antes de play:`, state)
                play('quest-complete', 0)
                console.log(`🔊 [TeamDashboardClient] play() chamado com sucesso`)
              } catch (err) {
                console.error(`❌ [TeamDashboardClient] Erro ao tocar som:`, err)
              }
            }, delayMs)
          }

          // ✅ Atualizar contagem e timestamp
          setLastEvaluatedCount(evaluatedCount)
          setLastEvaluatedTime(currentEvaluatedTime)

          // ✅ Forçar reload da página após um tempo para mostrar dados atualizados
          // Isso permite que os componentes server re-renderizem com os novos dados
          // Aguarda som tocar completamente antes de reload (500ms delay + duração do som ~2s + buffer)
          const reloadDelayMs = 500 + (newEvaluations * 2500) + 1000
          setTimeout(() => {
            console.log('🔄 Recarregando página para mostrar submissões atualizadas...')
            window.location.reload()
          }, reloadDelayMs)
        }
      } catch (err) {
        console.error('❌ Erro ao fazer polling de submissões:', err)
      } finally {
        isCheckingRef.current = false
      }
    }, 2000) // Poll a cada 2 segundos

    return () => {
      clearInterval(pollInterval)
    }
  }, [teamId]) // ✅ Only depend on teamId - polling should be stable

  // ✅ Este componente não renderiza nada, apenas gerencia efeitos colaterais
  return null
}
