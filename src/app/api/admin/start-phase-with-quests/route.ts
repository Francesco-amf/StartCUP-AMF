'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUTCTimestamp } from '@/lib/utils'
import { NextResponse } from 'next/server'

/**
 * Inicia uma fase E ativa automaticamente as quests da fase
 *
 * Request: { phase: number }
 * Response: { success, message, phase, questsActivated }
 */
export async function POST(request: Request) {
  try {
    const { phase } = await request.json()

    console.log(`🔵 START-PHASE-WITH-QUESTS ENDPOINT CALLED with phase: ${phase}`)

    const supabase = await createServerSupabaseClient()

    // Validar autenticação e permissão
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem iniciar fases.' },
        { status: 403 }
      )
    }

    // Validar fase
    if (phase < 0 || phase > 5) {
      return NextResponse.json(
        { error: 'Fase inválida (0-5)' },
        { status: 400 }
      )
    }

    // Usar service_role para bypassar RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Atualizar event_config para a nova fase
    const eventConfigId = '00000000-0000-0000-0000-000000000001'
    const updateData: any = {
      current_phase: phase,
    }

    if (phase >= 1) {
      updateData.event_started = true
      updateData.event_ended = false

      const newPhaseStartTime = getUTCTimestamp()
      updateData[`phase_${phase}_start_time`] = newPhaseStartTime

      console.log(`✅ Generated phase_${phase}_start_time: ${newPhaseStartTime}`)

      if (phase === 1) {
        updateData.event_start_time = getUTCTimestamp()
      }
    } else if (phase === 0) {
      updateData.event_started = false
      updateData.event_ended = false
      updateData.event_start_time = null
      updateData.event_end_time = null
      for (let i = 1; i <= 5; i++) {
        updateData[`phase_${i}_start_time`] = null
      }
    }

    const { error: configError } = await supabaseAdmin
      .from('event_config')
      .update(updateData)
      .eq('id', eventConfigId)

    if (configError) {
      console.error('Erro ao atualizar event_config:', configError)
      return NextResponse.json(
        { error: 'Erro ao atualizar configuração do evento' },
        { status: 500 }
      )
    }

    // 2. Se a fase >= 1, ativar primeira quest (em paralelo, não bloqueante)
    let questsActivated = 0

    if (phase >= 1) {
      // ✅ OTIMIZAÇÃO: Buscar fase e quest em uma única query
      const { data: phaseData } = await supabaseAdmin
        .from('phases')
        .select('id, name')
        .eq('order_index', phase)
        .single()

      if (phaseData) {
        // Ativar primeira quest da fase
        const { error: startError } = await supabaseAdmin
          .from('quests')
          .update({
            status: 'active',
            started_at: getUTCTimestamp()
          })
          .eq('phase_id', phaseData.id)
          .eq('order_index', 1)
          .select('name')
          .single()

        if (!startError) {
          questsActivated = 1
          console.log(`✅ Primeira quest da Fase ${phase} ativada`)
        }
      }
    } else if (phase === 0) {
      // Se voltando para preparação, fechar todas as quests
      const { error: closeError } = await supabaseAdmin
        .from('quests')
        .update({
          status: 'scheduled',
          started_at: null,
          ended_at: null
        })
        .in('status', ['active', 'closed'])

      console.log(`ℹ️ Todas as quests resetadas para fase de preparação`)
    }

    const phaseNames = [
      'Preparação',
      'Fase 1: Descoberta',
      'Fase 2: Criação',
      'Fase 3: Estratégia',
      'Fase 4: Refinamento',
      'Fase 5: Pitch Final'
    ]

    console.log(`✅ Sistema atualizado para: ${phaseNames[phase]}`)
    console.log(`✅ Quests ativadas: ${questsActivated}`)

    return NextResponse.json({
      success: true,
      message: `Fase atualizada para: ${phaseNames[phase]}. ${questsActivated} quest(s) ativada(s).`,
      phase,
      questsActivated,
      timestamp: getUTCTimestamp()
    })

  } catch (error) {
    console.error('Erro ao iniciar fase com quests:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
