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
    const fetchPenalties = async () => {
      try {
        const { data, error } = await supabase
          .from('penalties')
          .select('team_id, points_deducted')

        if (error) {
          console.error('Erro ao buscar penalidades:', error)
          setPenalties(new Map())
          setLoading(false)
          return
        }

        const penaltyMap = new Map<string, number>()

        if (data) {
          data.forEach((penalty: any) => {
            const current = penaltyMap.get(penalty.team_id) || 0
            penaltyMap.set(penalty.team_id, current + (penalty.points_deducted || 0))
          })
        }

        setPenalties(penaltyMap)
      } catch (error) {
        console.error('Erro ao buscar penalidades:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPenalties()

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchPenalties, 10000)
    return () => clearInterval(interval)
  }, [supabase])

  const getPenalty = (teamId: string): number => {
    return penalties.get(teamId) || 0
  }

  return { penalties, loading, getPenalty }
}
