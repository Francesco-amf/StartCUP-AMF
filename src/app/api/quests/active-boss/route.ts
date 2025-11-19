import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Buscar Boss ativo (quest com deliverable_type='presentation' e status='active')
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
      .or('deliverable_type.cs.{"presentation"},order_index.eq.4')
      .single()

    if (error || !quest) {
      return NextResponse.json({ quest: null })
    }

    // Verificar se realmente é Boss
    const isBoss = 
      (Array.isArray(quest.deliverable_type) 
        ? quest.deliverable_type.includes('presentation')
        : quest.deliverable_type === 'presentation'
      ) || quest.order_index === 4

    if (!isBoss) {
      return NextResponse.json({ quest: null })
    }

    return NextResponse.json({ quest })
  } catch (error) {
    console.error('Error fetching active boss:', error)
    return NextResponse.json({ quest: null })
  }
}
