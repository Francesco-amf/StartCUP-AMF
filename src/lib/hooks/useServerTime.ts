'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook para sincronizar tempo do cliente com servidor
 *
 * Problema que resolve:
 * - Cliente e servidor têm clocks desincronizados
 * - Quando quest termina no servidor, cliente pode estar com delay 5+ segundos
 * - Isso causa que o timer da fase "avance muito rápido" enquanto quest está parada
 *
 * Solução:
 * - Periodicamente fetcha o timestamp do servidor via API rápida
 * - Calcula offset entre cliente e servidor (latência compensada)
 * - Fornece um Date() "correto" que está sincronizado com servidor
 *
 * Uso:
 * const { serverTime, offset, isSync } = useServerTime()
 * // serverTime é um Proxy de Date que retorna a hora sincronizada com servidor
 * const now = serverTime.getTime() // Retorna timestamp com compensação
 */

interface ServerTimeSyncState {
  offset: number // Diferença entre servidor e cliente (ms)
  lastSync: number // Timestamp do último sync bem-sucedido
  syncCount: number // Quantas vezes fez sync
  isSynced: boolean // Se está sincronizado (dentro de threshold)
  latency: number // Latência medida da última requisição (ms)
}

export function useServerTime() {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [syncState, setSyncState] = useState<ServerTimeSyncState>({
    offset: 0,
    lastSync: Date.now(),
    syncCount: 0,
    isSynced: false,
    latency: 0
  })

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Sincronizar com servidor
   * Faz fetch do timestamp do servidor e calcula offset
   */
  const syncWithServer = async () => {
    try {
      const clientTimeBeforeRequest = Date.now()

      // 🚀 Fetch timestamp do servidor (endpoint rápido)
      // Poderia ser: GET /api/health com { timestamp: ... }
      // Ou: SELECT extract(epoch from now()) FROM quests LIMIT 1
      const { data: eventData } = await supabase
        .from('event_config')
        .select('created_at')
        .single()

      const clientTimeAfterRequest = Date.now()
      const roundTripLatency = clientTimeAfterRequest - clientTimeBeforeRequest
      const estimatedServerTime = new Date(eventData.created_at).getTime()

      // Estimar o tempo do servidor no momento exato do request (compensar latência)
      const estimatedServerTimeAtRequest = estimatedServerTime + (roundTripLatency / 2)

      // Calcular offset: quanto o servidor está "à frente" do cliente
      // offset > 0 = servidor está no futuro (cliente está atrasado)
      // offset < 0 = servidor está no passado (cliente está adiantado)
      const newOffset = estimatedServerTimeAtRequest - clientTimeBeforeRequest

      console.log(`⏱️ [ServerTime] Sync realizado:`, {
        clientTime: new Date(clientTimeBeforeRequest).toISOString(),
        estimatedServerTime: new Date(estimatedServerTimeAtRequest).toISOString(),
        offset: `${newOffset > 0 ? '+' : ''}${newOffset.toFixed(0)}ms`,
        latency: `${roundTripLatency}ms`,
        isSynced: Math.abs(newOffset) < 2000 // Considerar sincronizado se diferença < 2s
      })

      setSyncState(prev => ({
        offset: newOffset,
        lastSync: clientTimeBeforeRequest,
        syncCount: prev.syncCount + 1,
        isSynced: Math.abs(newOffset) < 2000,
        latency: roundTripLatency
      }))
    } catch (err) {
      console.error(`❌ [ServerTime] Erro ao sincronizar:`, err)
      setSyncState(prev => ({
        ...prev,
        isSynced: false
      }))
    }
  }

  /**
   * Inicia sincronização periódica com servidor
   */
  useEffect(() => {
    // Sync imediato na montagem
    syncWithServer()

    // Sync a cada 30 segundos para manter sincronização
    syncIntervalRef.current = setInterval(syncWithServer, 30 * 1000)

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [supabase])

  /**
   * Retorna um objeto que funciona como Date, mas sincronizado com servidor
   *
   * Exemplo:
   * const { serverTime } = useServerTime()
   * const now = serverTime.getTime() // Retorna timestamp correto
   * const isoString = serverTime.toISOString() // Retorna ISO string correta
   */
  const serverTime = {
    getTime: () => Date.now() + syncState.offset,
    valueOf: () => Date.now() + syncState.offset,
    toISOString: () => new Date(Date.now() + syncState.offset).toISOString(),
    toString: () => new Date(Date.now() + syncState.offset).toString(),
    // Método para criar um Date sincronizado
    toDate: () => new Date(Date.now() + syncState.offset),
    // Métodos comuns do Date
    getFullYear: () => new Date(Date.now() + syncState.offset).getFullYear(),
    getMonth: () => new Date(Date.now() + syncState.offset).getMonth(),
    getDate: () => new Date(Date.now() + syncState.offset).getDate(),
    getHours: () => new Date(Date.now() + syncState.offset).getHours(),
    getMinutes: () => new Date(Date.now() + syncState.offset).getMinutes(),
    getSeconds: () => new Date(Date.now() + syncState.offset).getSeconds(),
    getMilliseconds: () => new Date(Date.now() + syncState.offset).getMilliseconds(),
  }

  return {
    // Tempo sincronizado com servidor
    serverTime,

    // Informações de sincronização (para debug/logging)
    offset: syncState.offset,
    isSynced: syncState.isSynced,
    latency: syncState.latency,
    syncCount: syncState.syncCount,

    // Funções auxiliares
    forceSync: syncWithServer,

    // Data/hora como Date object sincronizado
    now: () => new Date(Date.now() + syncState.offset)
  }
}
