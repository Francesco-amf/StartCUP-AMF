import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Buscar Boss ativo (quest com order_index=4 e status='active')
    const { data: quest, error } = await supabase
      .from('quests')
      .select(`
        id,
        name,
        max_points,
        deliverable_type,
        order_index,
        status,
        phase:phase_id(
          name,
          order_index
        )
      `)
      .eq('status', 'active')
      .eq('order_index', 4)
      .maybeSingle()

    console.log('[active-boss] Query result:', { quest, error })

    if (error) {
      console.error('[active-boss] Error:', error)
      return NextResponse.json({ quest: null })
    }

    if (!quest) {
      console.log('[active-boss] No active boss found')
      return NextResponse.json({ quest: null })
    }

    console.log('[active-boss] Found active boss:', quest.name)
    return NextResponse.json({ quest })
  } catch (error) {
    console.error('[active-boss] Exception:', error)
    return NextResponse.json({ quest: null })
  }
}
