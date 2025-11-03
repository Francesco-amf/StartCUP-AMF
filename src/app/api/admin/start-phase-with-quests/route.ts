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

    // ✅ DIAGNOSTIC: Verify the update actually persisted
    if (phase >= 1) {
      const { data: verifyData } = await supabaseAdmin
        .from('event_config')
        .select(`phase_${phase}_start_time, current_phase`)
        .eq('id', eventConfigId)
        .single()

      const phaseStartColumn = `phase_${phase}_start_time`
      const setTimestamp = updateData[phaseStartColumn as keyof typeof updateData]
      const dbTimestamp = (verifyData as any)?.[phaseStartColumn]

      // Compare timestamps, ignoring the 'Z' suffix (both are UTC)
      const setTimestampNormalized = String(setTimestamp || '').replace('Z', '')
      const dbTimestampNormalized = String(dbTimestamp || '').replace('Z', '')
      const timestampsMatch = setTimestampNormalized === dbTimestampNormalized

      console.log(`✅ Phase ${phase} started:`)
      console.log(`   - Intended timestamp: ${setTimestamp}`)
      console.log(`   - Database timestamp: ${dbTimestamp}`)
      console.log(`   - Match: ${timestampsMatch ? '✅ YES' : '❌ NO'} (normalized)`)

      if (!timestampsMatch) {
        console.error(`⚠️ DATABASE MISMATCH: Update may not have persisted correctly`)
      } else {
        console.log(`✅ Timestamp successfully persisted to database!`)
      }
    }

    // 2. Se a fase >= 1, buscar a fase correspondente
    let questsActivated = 0

    if (phase >= 1) {
      // Buscar a fase do banco
      const { data: phaseData, error: phaseError } = await supabaseAdmin
        .from('phases')
        .select('id')
        .eq('order_index', phase)
        .single()

      if (phaseError) {
        console.error('Erro ao buscar fase:', phaseError)
        return NextResponse.json(
          { error: 'Erro ao buscar fase' },
          { status: 500 }
        )
      }

      // 3. Ativar a PRIMEIRA quest da fase automaticamente
      const { data: firstQuest, error: questError } = await supabaseAdmin
        .from('quests')
        .select('id, name, order_index')
        .eq('phase_id', phaseData.id)
        .order('order_index', { ascending: true })
        .limit(1)
        .single()

      if (questError) {
        console.warn('Nenhuma quest encontrada para esta fase:', questError)
      } else if (firstQuest) {
        // Ativar a primeira quest
        // IMPORTANTE: Usar getUTCTimestamp() para garantir UTC correto
        // Evita problema de timezone onde servidor local é interpretado como UTC
        const { error: startError } = await supabaseAdmin
          .from('quests')
          .update({
            status: 'active',
            started_at: getUTCTimestamp()
          })
          .eq('id', firstQuest.id)

        if (startError) {
          console.error('Erro ao ativar primeira quest:', startError)
        } else {
          questsActivated = 1
          console.log(`✅ Primeira quest da Fase ${phase} ativada: ${firstQuest.name}`)
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
