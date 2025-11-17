import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/update-phase-timing
 * Updates the phase start time in event_config for offset synchronization
 *
 * Body:
 * - phase: number (1-5)
 * - newPhaseStartedAt: ISO string
 */
export async function POST(request: NextRequest) {
  try {
    const { phase, newPhaseStartedAt } = await request.json()

    if (!phase || !newPhaseStartedAt) {
      return NextResponse.json(
        { error: 'Missing phase or newPhaseStartedAt' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()
    const phaseFieldName = `phase_${phase}_start_time`
    const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'

    console.log(`📡 [update-phase-timing API] Atualizando ${phaseFieldName}`)
    console.log(`   - phase: ${phase}`)
    console.log(`   - newPhaseStartedAt: ${newPhaseStartedAt}`)
    console.log(`   - eventConfigId: ${eventConfigId}`)

    const { error, data } = await supabase
      .from('event_config')
      .update({
        [phaseFieldName]: newPhaseStartedAt
      })
      .eq('id', eventConfigId)
      .select()

    if (error) {
      console.error(`❌ [update-phase-timing API] Erro ao atualizar:`, error)
      return NextResponse.json(
        { error: `Failed to update phase timing: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`✅ [update-phase-timing API] ${phaseFieldName} atualizado com sucesso`, data)

    return NextResponse.json({
      success: true,
      message: `Phase ${phase} timing updated`,
      data
    })
  } catch (err: any) {
    console.error(`❌ [update-phase-timing API] Exceção:`, err)
    return NextResponse.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}
