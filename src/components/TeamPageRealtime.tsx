'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * ✅ Componente para sincronizar dados em tempo real nas páginas de equipe
 *
 * Problema: Páginas de equipe (dashboard, submit, avaliador) são server-components
 * que buscam dados uma única vez. Quando os dados mudam no banco (quest avançada, etc),
 * as páginas não atualizam até um refresh manual.
 *
 * Solução: Polling de 2 segundos que dispara um refresh quando detecta mudança
 *
 * Como funciona:
 * 1. Armazena hash dos dados iniciais
 * 2. A cada 2s, faz fetch dos mesmos dados
 * 3. Compara hash - se mudou, chama router.refresh()
 * 4. Isso permite que server-component busque dados novos
 */

interface TeamPageRealtimeProps {
  dataSnapshot: string  // Hash ou JSON string dos dados iniciais
  endpoint?: string  // Endpoint para verificar mudanças (default: /api/team/check-updates)
  pollIntervalMs?: number  // Intervalo de polling em ms (default: 2000)
}

export default function TeamPageRealtime({
  dataSnapshot,
  endpoint = '/api/team/check-updates',
  pollIntervalMs = 2000
}: TeamPageRealtimeProps) {
  const router = useRouter()
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastCheckedRef = useRef<string>(dataSnapshot)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkForUpdates = async () => {
      try {
        // Buscar dados atualizados
        const response = await fetch(endpoint, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.warn(`⚠️ [TeamPageRealtime] Failed to check updates: ${response.status}`)
          return
        }

        const data = await response.json()

        // Se os dados mudaram, fazer refresh
        if (data.snapshot !== lastCheckedRef.current) {
          console.log(`✅ [TeamPageRealtime] Dados detectados como diferentes! Atualizando página...`)
          console.log(`   - Anterior: ${lastCheckedRef.current?.substring(0, 50)}...`)
          console.log(`   - Novo: ${data.snapshot?.substring(0, 50)}...`)

          lastCheckedRef.current = data.snapshot

          // ✅ Usar router.refresh() APENAS quando há mudança
          // Isso permite que server-component busque dados novos sem flashing
          router.refresh()
        }
      } catch (error) {
        console.error(`❌ [TeamPageRealtime] Erro ao checar atualizações:`, error)
      }
    }

    // Início imediato
    checkForUpdates()

    // Polling
    pollIntervalRef.current = setInterval(checkForUpdates, pollIntervalMs)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [endpoint, pollIntervalMs, router])

  // Este componente não renderiza nada - é apenas um listener
  return null
}
