'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'

interface EvaluatorDashboardClientProps {
  initialPendingCount: number
}

/**
 * ✅ Componente cliente para tocar som quando avaliação é enviada
 *
 * Detecta query parameter "evaluated=true" que é adicionado após
 * redirecionamento da página de avaliação individual
 */
export default function EvaluatorDashboardClient({
  initialPendingCount
}: EvaluatorDashboardClientProps) {
  const { play } = useSoundSystem()
  const searchParams = useSearchParams()
  const evaluated = searchParams.get('evaluated')

  useEffect(() => {
    // ✅ Se veio de avaliação (evaluated=true), toca sons de conclusão
    if (evaluated === 'true') {
      console.log('✅ [EvaluatorDashboardClient] Detectado evaluated=true, tocando sons...')

      // ✅ Delay maior para garantir que componente está montado e som system pronto
      // Navigation + component mount + sound system initialization pode levar ~500ms
      const soundTimer1 = setTimeout(() => {
        console.log('🔊 Tocando: quest-complete')
        play('quest-complete', 0)
      }, 800)

      // ✅ Tocar som de coins/moedas após quest-complete
      // quest-complete dura ~2s, coins deve tocar depois
      // 800ms (delay inicial) + 2000ms (quest-complete duration) + 200ms (buffer) = 3000ms
      const soundTimer2 = setTimeout(() => {
        console.log('🔊 Tocando: coins')
        play('coins', 0)
      }, 3000)

      return () => {
        clearTimeout(soundTimer1)
        clearTimeout(soundTimer2)
      }
    }
  }, [evaluated, play])

  // ✅ Este componente não renderiza nada, apenas gerencia efeitos colaterais
  return null
}
