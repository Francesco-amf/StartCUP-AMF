import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface PenaltyData {
  team_id: string
  total_deduction: number
  penalty_count: number
}

export function usePenalties() {
  const [penalties, setPenalties] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    const subscriptionRef = { current: null as any }

    const fetchPenalties = async () => {
      try {
        const { data, error } = await supabase
          .from('penalties')
          .select('team_id, points_deduction')

        if (error) {
          console.error('❌ Erro ao buscar penalidades:', error)
          if (isMounted) {
            setPenalties(new Map())
            setLoading(false)
          }
          return
        }

        const penaltyMap = new Map<string, number>()

        if (data) {
          data.forEach((penalty: any) => {
            const current = penaltyMap.get(penalty.team_id) || 0
            penaltyMap.set(penalty.team_id, current + (penalty.points_deduction || 0))
          })
        }

        if (isMounted) {
          setPenalties(penaltyMap)
          console.log(`✅ [usePenalties] Penalidades carregadas: ${penaltyMap.size} times`)
        }
      } catch (error) {
        console.error('❌ Erro ao buscar penalidades:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Fetch inicial
    fetchPenalties()

    // 🔴 NOVO: Realtime listener para mudanças em penalidades
    const setupRealtimeListener = () => {
      const channel = supabase
        .channel('public:penalties')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'penalties'
          },
          (payload: any) => {
            if (!isMounted) return

            console.log(`🔴 [usePenalties] Mudança em penalidades detectada:`, {
              event: payload.eventType,
              team_id: payload.new?.team_id || payload.old?.team_id
            })

            // Refetch penalidades para garantir integridade
            fetchPenalties()
          }
        )
        .subscribe((status: any) => {
          console.log(`📡 [usePenalties] Realtime status: ${status}`)
        })

      subscriptionRef.current = channel
    }

    setupRealtimeListener()

    return () => {
      isMounted = false
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [supabase])

  const getPenalty = (teamId: string): number => {
    return penalties.get(teamId) || 0
  }

  return { penalties, loading, getPenalty }
}
