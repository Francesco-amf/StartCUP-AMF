'use client'

import { useEffect, useCallback, useRef } from 'react'

/**
 * Hook para sincronizar estado entre abas SEM fazer refresh completo
 *
 * Usa LocalStorage para comunicação (alternativa ao BroadcastChannel com menos impacto)
 * Permite que live-dashboard detecte mudanças do control-panel sem flashing
 *
 * Uso:
 * const { onTabsStateChange } = useCrossTabSync('quest-updates', (data) => {
 *   console.log('Quest foi atualizada em outra aba:', data)
 *   // Atualizar dados locais sem fazer refresh()
 * })
 */

interface UseCrossTabSyncOptions {
  onStateChange?: (data: any) => void
  debounceMs?: number
}

export function useCrossTabSync(
  channel: string,
  options: UseCrossTabSyncOptions = {}
) {
  const {
    onStateChange,
    debounceMs = 100
  } = options

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastProcessedRef = useRef<string>('')

  // Broadcast para outras abas que algo mudou
  const notifyStateChange = useCallback((data: any) => {
    const payload = JSON.stringify(data)

    // Evitar processar a mesma mudança múltiplas vezes
    if (lastProcessedRef.current === payload) {
      return
    }

    lastProcessedRef.current = payload

    // Usar localStorage + storage event para notificar outras abas
    try {
      localStorage.setItem(`${channel}-timestamp`, Date.now().toString())
      localStorage.setItem(`${channel}-data`, payload)
    } catch (e) {
      console.warn(`⚠️ [useCrossTabSync] Falha ao escrever localStorage:`, e)
    }
  }, [channel])

  // Escutar mudanças de outras abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Verificar se é a mensagem do nosso canal
      if (e.key === `${channel}-timestamp` && e.newValue && onStateChange) {
        // Debounce para evitar múltiplos processamentos
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        debounceTimerRef.current = setTimeout(() => {
          try {
            const data = localStorage.getItem(`${channel}-data`)
            if (data && data !== lastProcessedRef.current) {
              const parsed = JSON.parse(data)
              lastProcessedRef.current = data
              onStateChange(parsed)
            }
          } catch (e) {
            console.warn(`⚠️ [useCrossTabSync] Falha ao ler localStorage:`, e)
          }
        }, debounceMs)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [channel, onStateChange, debounceMs])

  return {
    notifyStateChange
  }
}
