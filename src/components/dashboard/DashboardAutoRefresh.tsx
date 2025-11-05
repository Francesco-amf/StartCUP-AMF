'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Componente que força refresh da página quando há mudanças importantes
 * usando WebSocket Realtime do Supabase (em vez de polling)
 */
export default function DashboardAutoRefresh() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // ✅ WebSocket: Escutar mudanças nas tabelas que afetam o dashboard da equipe
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_config' }, () => {
        console.log('📡 Event config changed, refreshing dashboard...')
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quests' }, () => {
        console.log('📡 Quest changed, refreshing dashboard...')
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluations' }, () => {
        console.log('📡 Evaluation added, refreshing dashboard...')
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coin_adjustments' }, () => {
        console.log('📡 Coins adjusted, refreshing dashboard...')
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'penalties' }, () => {
        console.log('📡 Penalty applied, refreshing dashboard...')
        router.refresh()
      })
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  return null // Componente invisível
}

