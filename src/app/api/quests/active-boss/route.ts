import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Buscar Boss ativo OU fechado recentemente (nas últimas 2 horas)
    // Isso permite avaliadores avaliarem mesmo após o prazo expirar
    const { data: quests, error } = await supabase
      .from('quests')
      .select(`
        id,
        name,
        max_points,
        deliverable_type,
        order_index,
        status,
        started_at,
        planned_deadline_minutes,
        phase:phase_id(
          name,
          order_index
        )
      `)
      .eq('order_index', 4)
      .or('status.eq.active,status.eq.closed')
      .order('started_at', { ascending: false })

    console.log('[active-boss] Query result:', { quests, error })

    if (error) {
      console.error('[active-boss] Error:', error)
      return NextResponse.json({ quest: null })
    }

    if (!quests || quests.length === 0) {
      console.log('[active-boss] No boss found (active or recent)')
      return NextResponse.json({ quest: null })
    }

    // Priorizar Boss ativo, senão pegar o mais recente fechado (últimas 2 horas)
    const activeBoss = quests.find(q => q.status === 'active')
    
    if (activeBoss) {
      console.log('[active-boss] Found active boss:', activeBoss.name)
      return NextResponse.json({ quest: activeBoss })
    }

    // Se não há Boss ativo, verificar se há Boss fechado recentemente (última 1 hora)
    const recentBoss = quests.find(q => {
      if (!q.started_at) return false
      const startTime = new Date(q.started_at).getTime()
      const now = Date.now()
      const oneHourInMs = 1 * 60 * 60 * 1000
      const timeSinceStart = now - startTime
      return timeSinceStart <= oneHourInMs
    })

    if (recentBoss) {
      console.log('[active-boss] Found recent closed boss:', recentBoss.name)
      return NextResponse.json({ quest: recentBoss })
    }

    console.log('[active-boss] No boss found within evaluation window')
    return NextResponse.json({ quest: null })
  } catch (error) {
    console.error('[active-boss] Exception:', error)
    return NextResponse.json({ quest: null })
  }
}
