'use client'

import { useRouter } from 'next/navigation'
import { useRef, useEffect } from 'react'

/**
 * Hook que gerencia refresh inteligente da página
 *
 * Problemas que resolve:
 * 1. Impede refresh excessivo em múltiplas abas
 * 2. Permite refresh apenas quando realmente necessário
 * 3. Detecta mudanças de dados sem fazer refresh completo
 *
 * Uso:
 * const { shouldRefreshData } = useSmartRefresh({
 *   enableAutoRefresh: false,  // Disable auto-refresh (use data updates instead)
 *   refreshInterval: 30000,     // Se enableAutoRefresh, quanto tempo entre refreshes
 *   forceRefreshOn: ['admin']   // Rotas admin sempre fazem refresh
 * })
 */

interface UseSmartRefreshOptions {
  enableAutoRefresh?: boolean
  refreshInterval?: number
  forceRefreshOn?: string[]
}

export function useSmartRefresh(options: UseSmartRefreshOptions = {}) {
  const router = useRouter()
  const {
    enableAutoRefresh = false,
    refreshInterval = 30000,
    forceRefreshOn = []
  } = options

  const isAdminRef = useRef(false)
  const lastRefreshRef = useRef<number>(0)
  const refreshDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Detectar se é rota admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      isAdminRef.current = window.location.pathname.includes('/admin') ||
                           window.location.pathname.includes('/control-panel')
    }
  }, [])

  // Auto-refresh (desabilitado por padrão para live-dashboard)
  useEffect(() => {
    if (!enableAutoRefresh) return

    const interval = setInterval(() => {
      const now = Date.now()
      // Debounce: não fazer refresh se foi feito há menos de 5s
      if (now - lastRefreshRef.current > 5000) {
        lastRefreshRef.current = now
        router.refresh()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [enableAutoRefresh, refreshInterval, router])

  // Função para fazer refresh com debounce
  const performRefresh = (delayMs: number = 0) => {
    // Se é admin, sempre fazer refresh
    if (isAdminRef.current && forceRefreshOn.includes('admin')) {
      if (refreshDebounceTimerRef.current) {
        clearTimeout(refreshDebounceTimerRef.current)
      }

      if (delayMs > 0) {
        refreshDebounceTimerRef.current = setTimeout(() => {
          lastRefreshRef.current = Date.now()
          router.refresh()
        }, delayMs)
      } else {
        lastRefreshRef.current = Date.now()
        router.refresh()
      }
    }
    // Se não é admin e auto-refresh está desabilitado, apenas log (dados vêm via polling)
    else if (!enableAutoRefresh) {
      console.log('💾 [useSmartRefresh] Dados detectados como mudados, mas auto-refresh desabilitado. Usando polling realtime.')
    }
  }

  return {
    performRefresh,
    isAdmin: isAdminRef.current,
    shouldRefreshData: enableAutoRefresh
  }
}
