'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Componente que força refresh automático da página a cada 30 segundos
 * para detectar mudanças de fase e quest automaticamente
 */
export default function DashboardAutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    // Refresh a cada 30 segundos
    const interval = setInterval(() => {
      router.refresh()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [router])

  return null // Componente invisível
}
