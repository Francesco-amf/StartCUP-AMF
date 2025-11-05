'use client'

/**
 * 🗑️ COMPONENTE REMOVIDO - Redundante com useRealtimePhase (polling 2s)
 * 
 * Antes: Fazia router.refresh() a cada 5s como fallback do WebSocket
 * Agora: Desnecessário pois useRealtimePhase já atualiza dados a cada 2s
 * 
 * Mantido apenas para não quebrar imports, mas não faz nada
 */
export default function DashboardAutoRefresh() {
  return null
}

