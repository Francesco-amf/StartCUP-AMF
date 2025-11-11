'use client'

import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'
import { createLogger } from '@/lib/logging'

const logger = createLogger('useRealtimePenaltiesOptimized')

/**
 * Optimized penalties fetcher using SWR
 * - Detecção automática de novas penalidades
 * - Som automático para penalidades novas
 * - Caching inteligente
 * - Menos requisições que polling
 */
export function useRealtimePenaltiesOptimized() {
  const supabase = createClient()
  const { play } = useSoundSystem()
  const previousPenaltyIdsRef = useRef<Set<string>>(new Set())
  const isFirstRenderRef = useRef(true)

  // SWR fetcher
  const fetcher = async () => {
    try {
      const { data, error } = await supabase
        .from('penalties')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        logger.warn(new Error(error.message), 'Error fetching penalties')
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error(err, 'Penalties fetch failed')
      throw error
    }
  }

  // Usar SWR com opções otimizadas
  const { data, error, isLoading, mutate } = useSWR('penalties', fetcher, {
    revalidateOnFocus: false, // Desabilitado: evita refetch ao mudar de aba (interrompe áudio)
    revalidateOnReconnect: false, // Desabilitado: refreshInterval já cuida disso
    revalidateIfStale: false, // Desabilitado: refreshInterval + polling já suficiente
    dedupingInterval: 2000,
    focusThrottleInterval: 5000,
    errorRetryInterval: 5000,
    errorRetryCount: 3,
    fallbackData: [],
    refreshInterval: 5000, // Revalidar a cada 5s para penalidades (mais importante detectar rapidamente)
    refreshWhenOffline: false,
    refreshWhenHidden: false,
  })

  // Detectar penalidades novas e tocar som
  useEffect(() => {
    if (!data || data.length === 0) return

    if (!isFirstRenderRef.current) {
      data.forEach((penalty: any) => {
        if (!previousPenaltyIdsRef.current.has(penalty.id)) {
          logger.info(`New penalty detected: ${penalty.id}`)
          play('penalty')
        }
      })
    }

    // Atualizar conjunto de IDs
    previousPenaltyIdsRef.current = new Set(data.map((p: any) => p.id))

    // Marcar que primeira renderização foi feita
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
    }
  }, [data, play])

  const loading = isLoading || (!data && !error)
  const penalties = data || []

  return {
    penalties,
    loading,
    error,
    mutate,
  }
}
