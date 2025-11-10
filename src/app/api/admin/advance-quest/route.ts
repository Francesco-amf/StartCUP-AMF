'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUTCTimestamp } from '@/lib/utils'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * Avança para a próxima quest ou para a próxima fase se a atual terminou.
 *
 * Request: { questId: string }
 * Response: { success, message, nextQuestId?, nextPhaseId?, phaseAdvanced?, questActivated? }
 */
export async function POST(request: Request) {
  try {
    const { questId } = await request.json()

    console.log(`🔵 ADVANCE-QUEST ENDPOINT CALLED for questId: ${questId}`)

    const supabase = await createServerSupabaseClient()

    // Validar autenticação e permissão (apenas admin ou sistema)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem avançar quests.' },
        { status: 403 }
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

    // 1. Marcar a quest atual como 'closed'
    const { data: currentQuest, error: currentQuestError } = await supabaseAdmin
      .from('quests')
      .update({ status: 'closed', ended_at: getUTCTimestamp() })
      .eq('id', questId)
      .select('id, phase_id, order_index')
      .single()

    if (currentQuestError || !currentQuest) {
      console.error('Erro ao fechar quest atual:', currentQuestError)
      return NextResponse.json(
        { error: 'Erro ao fechar quest atual ou quest não encontrada.' },
        { status: 404 }
      )
    }

    console.log(`✅ Quest ${currentQuest.id} (${currentQuest.order_index}) da Fase ${currentQuest.phase_id} marcada como 'closed'.`)

    // 2. Tentar encontrar e ativar a próxima quest na mesma fase
    console.log(`🔍 Procurando próxima quest: phase_id=${currentQuest.phase_id}, order_index=${currentQuest.order_index + 1}`)

    const { data: nextQuest, error: nextQuestError } = await supabaseAdmin
      .from('quests')
      .select('id, name, order_index')
      .eq('phase_id', currentQuest.phase_id)
      .eq('order_index', currentQuest.order_index + 1)
      .single()

    if (nextQuestError && nextQuestError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Erro ao buscar próxima quest:', {
        code: nextQuestError.code,
        message: nextQuestError.message,
        details: nextQuestError.details
      })
      return NextResponse.json(
        { error: 'Erro ao buscar próxima quest.' },
        { status: 500 }
      )
    }

    if (nextQuestError?.code === 'PGRST116') {
      console.log(`ℹ️ Nenhuma próxima quest encontrada (PGRST116)`)
    } else if (nextQuest) {
      console.log(`✅ Próxima quest encontrada: ${nextQuest.name} (order_index=${nextQuest.order_index})`)
    }

    if (nextQuest) {
      // Ativar a próxima quest na mesma fase
      const { data: activatedQuest, error: startNextQuestError } = await supabaseAdmin
        .from('quests')
        .update({ status: 'active', started_at: getUTCTimestamp() })
        .eq('id', nextQuest.id)
        .select('id, name, status, started_at')
        .single()

      if (startNextQuestError) {
        console.error('Erro ao ativar próxima quest:', startNextQuestError)
        return NextResponse.json(
          { error: 'Erro ao ativar próxima quest.' },
          { status: 500 }
        )
      }
      console.log(`✅ Próxima quest ${nextQuest.id} (${nextQuest.name}) ativada na Fase ${currentQuest.phase_id}. Status: ${activatedQuest?.status}`)
      revalidatePath('/dashboard')
      revalidatePath('/submit')
      return NextResponse.json({
        success: true,
        message: `Quest ${currentQuest.order_index} fechada. Quest ${nextQuest.order_index} ativada.`,
        questActivated: nextQuest.id,
      }, { status: 200 })
    } else {
      // Nenhuma próxima quest na fase atual, avançar para a próxima fase
      console.log(`ℹ️ Todas as quests da Fase ${currentQuest.phase_id} concluídas. Tentando avançar para a próxima fase...`)

      const nextPhaseId = currentQuest.phase_id + 1;
      
      // Verificar se a próxima fase existe (máximo 5 fases)
      if (nextPhaseId > 5) {
        console.log(`✅ Todas as fases concluídas! Evento finalizado.`)
        
        // Marcar evento como concluído
        const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'
        const { error: eventEndError } = await supabaseAdmin
          .from('event_config')
          .update({
            event_ended: true,
            event_end_time: getUTCTimestamp()
          })
          .eq('id', eventConfigId)

        if (eventEndError) {
          console.error('Erro ao marcar evento como concluído:', eventEndError)
          return NextResponse.json(
            { error: 'Erro ao finalizar evento.' },
            { status: 500 }
          )
        }

        revalidatePath('/dashboard')
        revalidatePath('/submit')
        return NextResponse.json({
          success: true,
          message: `Todas as quests da Fase ${currentQuest.phase_id} concluídas. Evento finalizado! 🎉`,
          eventEnded: true,
        }, { status: 200 })
      }

      // Iniciar a próxima fase diretamente (sem usar fetch)
      const phaseNames = [
        'Preparação',
        'Fase 1: Descoberta',
        'Fase 2: Criação',
        'Fase 3: Estratégia',
        'Fase 4: Refinamento',
        'Fase 5: Pitch Final'
      ]

      const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'

      // Atualizar event_config para a nova fase
      const updateData: Record<string, any> = {
        current_phase: nextPhaseId,
        event_started: true,
        event_ended: false
      }

      const newPhaseStartTime = getUTCTimestamp()
      updateData[`phase_${nextPhaseId}_start_time`] = newPhaseStartTime

      const { data: updatedConfig, error: configError } = await supabaseAdmin
        .from('event_config')
        .update(updateData)
        .eq('id', eventConfigId)
        .select('current_phase, event_started')
        .single()

      if (configError) {
        console.error('Erro ao atualizar event_config para nova fase:', configError)
        return NextResponse.json(
          { error: 'Erro ao atualizar configuração do evento para nova fase.' },
          { status: 500 }
        )
      }

      console.log(`✅ Event config atualizado para ${phaseNames[nextPhaseId]} (Phase: ${updatedConfig?.current_phase}, Started: ${updatedConfig?.event_started})`)

      // Buscar a fase do banco
      const { data: phaseData, error: phaseError } = await supabaseAdmin
        .from('phases')
        .select('id')
        .eq('order_index', nextPhaseId)
        .single()

      if (phaseError) {
        console.error('Erro ao buscar próxima fase:', phaseError)
        return NextResponse.json(
          { error: 'Erro ao buscar próxima fase' },
          { status: 500 }
        )
      }

      // Ativar a PRIMEIRA quest da nova fase
      const { data: firstQuestOfNewPhase, error: firstQuestError } = await supabaseAdmin
        .from('quests')
        .select('id, name, order_index')
        .eq('phase_id', phaseData.id)
        .order('order_index', { ascending: true })
        .limit(1)
        .single()

      let questsActivated = 0
      if (firstQuestError) {
        console.warn('Nenhuma quest encontrada para a próxima fase:', firstQuestError)
      } else if (firstQuestOfNewPhase) {
        const { data: activatedFirstQuest, error: startError } = await supabaseAdmin
          .from('quests')
          .update({
            status: 'active',
            started_at: getUTCTimestamp()
          })
          .eq('id', firstQuestOfNewPhase.id)
          .select('id, name, status, started_at')
          .single()

        if (startError) {
          console.error('Erro ao ativar primeira quest da nova fase:', startError)
        } else {
          questsActivated = 1
          console.log(`✅ Primeira quest da ${phaseNames[nextPhaseId]} ativada: ${firstQuestOfNewPhase.name} (Status: ${activatedFirstQuest?.status})`)
        }
      }

      console.log(`✅ Fase ${nextPhaseId} (${phaseNames[nextPhaseId]}) avançada automaticamente!`) 
      revalidatePath('/dashboard')
      revalidatePath('/submit')
      return NextResponse.json({
        success: true,
        message: `Todas as quests da Fase ${currentQuest.phase_id} concluídas. ${phaseNames[nextPhaseId]} iniciada com ${questsActivated} quest(s) ativada(s).`,
        phaseAdvanced: nextPhaseId,
        questsActivated,
      }, { status: 200 })
    }

  } catch (error) {
    console.error('Erro fatal ao avançar quest:', error)
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
