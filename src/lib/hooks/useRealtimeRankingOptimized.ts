'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { createLogger } from '@/lib/logging'

const logger = createLogger('useRealtimeRankingOptimized')

/**
 * Otimized ranking fetcher using SWR instead of polling
 * - Caching inteligente
 - Revalidação automática
 * - Deduplicação de requisições
 * - Focus refetch (quando volta para aba)
 * - Fallback durante loading
 */
export function useRealtimeRankingOptimized() {
  const supabase = createClient()

  // SWR fetcher
  const fetcher = async () => {
    try {
      const { data, error } = await supabase
        .from('live_ranking')
        .select('*')
        .order('total_points', { ascending: false })

      if (error) {
        logger.warn(new Error(error.message), 'Error fetching ranking')
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error(err, 'Ranking fetch failed')
      throw error
    }
  }

  // Usar SWR com opções otimizadas
  const { data, error, isLoading, mutate } = useSWR(
    'live_ranking', // key
    fetcher,
    {
      // Cache strategy
      revalidateOnFocus: false, // ❌ DESABILITADO: evita refetch ao mudar de aba (interrompe áudio)
      revalidateOnReconnect: false, // ❌ DESABILITADO: refreshInterval já cuida disso
      revalidateIfStale: false, // ❌ DESABILITADO: refreshInterval + polling já suficiente

      // Performance
      dedupingInterval: 2000, // Deduplicar requisições dentro de 2s
      focusThrottleInterval: 5000, // Throttle focus revalidation a cada 5s
      errorRetryInterval: 5000, // Retry a cada 5s em caso de erro
      errorRetryCount: 3, // Máximo 3 tentativas

      // Default data while loading
      fallbackData: [],

      // Refresh strategy
      refreshInterval: 5000, // Reduzido de 10s para maior responsividade
      refreshWhenOffline: false, // Não revalidar offline
      refreshWhenHidden: false, // Não revalidar quando aba não está visível
    }
  )

  const loading = isLoading || (!data && !error)
  const ranking = data || []

  return {
    ranking,
    loading,
    error,
    mutate, // Permite mutação manual do cache
  }
}

/**
 * Exemplo de uso:
 *
 * const { ranking, loading, error, mutate } = useRealtimeRankingOptimized()
 *
 * // Para forçar refresh:
 * mutate()
 *
 * // Para otimista update:
 * mutate([...newRanking], false)
 */
