'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUTCTimestamp } from '@/lib/utils'
import { NextResponse } from 'next/server'
// ✅ REMOVIDO: revalidatePath - polling detecta mudanças automaticamente

// Simples lock em memória para evitar race conditions
// Rastreia quais quests estão sendo processadas no momento
const processingQuests = new Map<string, number>()
const PROCESSING_TIMEOUT = 10000 // 10 segundos - tempo máximo para processar um advance

/**
 * Avança para a próxima quest ou para a próxima fase se a atual terminou.
 *
 * Request: { questId: string }
 * Response: { success, message, nextQuestId?, nextPhaseId?, phaseAdvanced?, questActivated? }
 */
export async function POST(request: Request) {
  const { questId } = await request.json()

  console.log(`🔵 ADVANCE-QUEST ENDPOINT CALLED for questId: ${questId}`)

  // PROTEÇÃO: Evitar race conditions - verificar se esta quest já está sendo processada
  const now = Date.now()
  const existingTimestamp = processingQuests.get(questId)

  if (existingTimestamp && (now - existingTimestamp) < PROCESSING_TIMEOUT) {
    console.warn(`⚠️ [RACE-CONDITION PROTECTION] Quest ${questId} já está sendo processada! Rejeitando duplicate call.`)
    return NextResponse.json(
      {
        error: 'Esta quest já está sendo avançada. Evitando race condition.',
        code: 'DUPLICATE_ADVANCE'
      },
      { status: 429 } // 429 = Too Many Requests
    )
  }

  // Marcar como em processamento
  processingQuests.set(questId, now)
  console.log(`✅ Quest ${questId} marcada como em processamento. (Total em processamento: ${processingQuests.size})`)

  try {
    // ⚠️ IMPORTANTE: QuestAutoAdvancer é executado PELO CLIENTE (team), não por um admin
    // Esta API é chamada automaticamente pelo cliente para avançar quests quando expiram
    // Não fazemos autenticação aqui pois é uma operação do sistema
    //
    // A segurança é garantida pelo:
    // 1. Service role key que opera com privilégios elevados no banco
    // 2. Validação de quest existence no banco
    // 3. RLS policies que controlam who can read/modify quests

    console.log(`🔵 [ADVANCE-QUEST] Iniciando advance para quest: ${questId}`)

    // Usar service_role para bypassar RLS e fazer as operações do sistema
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
    console.log(`📝 Tentando fechar quest: ${questId}`)
    const { data: currentQuest, error: currentQuestError } = await supabaseAdmin
      .from('quests')
      .update({ status: 'closed', ended_at: getUTCTimestamp() })
      .eq('id', questId)
      .select('id, phase_id, order_index')

    if (currentQuestError) {
      console.error('Erro ao fechar quest atual:', currentQuestError)
      return NextResponse.json(
        { error: 'Erro ao fechar quest atual ou quest não encontrada.' },
        { status: 500 }
      )
    }

    // Handle array response from .select()
    const closedQuestData = Array.isArray(currentQuest) ? currentQuest[0] : currentQuest

    if (!closedQuestData || !closedQuestData.id) {
      console.error('❌ Closing quest returned no data:', { data: currentQuest, error: currentQuestError })
      return NextResponse.json(
        { error: 'Erro ao fechar quest - no data returned' },
        { status: 500 }
      )
    }

    console.log(`✅ Quest ${closedQuestData.id} (${closedQuestData.order_index}) da Fase ${closedQuestData.phase_id} marcada como 'closed'.`)

    // 2. Tentar encontrar e ativar a próxima quest na mesma fase
    console.log(`🔍 Procurando próxima quest: phase_id=${closedQuestData.phase_id}, order_index=${closedQuestData.order_index + 1}`)

    const { data: nextQuest, error: nextQuestError } = await supabaseAdmin
      .from('quests')
      .select('id, name, order_index')
      .eq('phase_id', closedQuestData.phase_id)
      .eq('order_index', closedQuestData.order_index + 1)
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
    } else {
      console.log(`⚠️ nextQuest data:`, { nextQuest, nextQuestError })
    }

    if (nextQuest && nextQuest.id) {
      // Ativar a próxima quest na mesma fase
      const updateTime = getUTCTimestamp()
      console.log(`📝 Tentando ativar quest ${nextQuest.id} com timestamp: ${updateTime}`)
      console.log(`📋 NextQuest completo:`, JSON.stringify(nextQuest, null, 2))

      // CRITICAL: Validar que nextQuest.id existe antes de usar
      if (!nextQuest.id || typeof nextQuest.id !== 'string') {
        console.error('❌ ERRO CRÍTICO: nextQuest.id inválido:', { id: nextQuest.id, type: typeof nextQuest.id })
        return NextResponse.json(
          {
            error: 'Erro ao ativar próxima quest.',
            details: 'Quest ID inválido',
            code: 'INVALID_QUEST_ID'
          },
          { status: 500 }
        )
      }

      // Debug: Testar query manualmente ANTES de usar
      console.log(`🔍 [DEBUG] Tentando UPDATE com:`)
      console.log(`   - table: 'quests'`)
      console.log(`   - update: { status: 'active', started_at: '${updateTime}' }`)
      console.log(`   - eq('id', '${nextQuest.id}')`)

      const { data: activatedQuests, error: startNextQuestError } = await supabaseAdmin
        .from('quests')
        .update({ status: 'active', started_at: updateTime })
        .eq('id', nextQuest.id)
        .select('id, name, status, started_at')

      console.log(`📊 [DEBUG] Resultado do UPDATE:`)
      console.log(`   - data: ${JSON.stringify(activatedQuests)}`)
      console.log(`   - error: ${JSON.stringify(startNextQuestError)}`)

      if (startNextQuestError) {
        console.error('❌ Erro ao ativar próxima quest:', {
          code: startNextQuestError.code,
          message: startNextQuestError.message,
          details: startNextQuestError.details,
          hint: startNextQuestError.hint,
          questId: nextQuest.id,
          questName: nextQuest.name,
          questOrderIndex: nextQuest.order_index
        })
        return NextResponse.json(
          {
            error: 'Erro ao ativar próxima quest.',
            details: startNextQuestError.message,
            code: startNextQuestError.code,
            questId: nextQuest.id
          },
          { status: 500 }
        )
      }

      // Check if update actually returned data
      if (!activatedQuests || activatedQuests.length === 0) {
        console.error('❌ Update retornou 0 linhas! Quest pode não existir ou RLS bloqueou.')
        return NextResponse.json(
          {
            error: 'Erro ao ativar próxima quest.',
            details: 'Update retornou 0 linhas',
            code: 'NO_ROWS_AFFECTED'
          },
          { status: 500 }
        )
      }

      const activatedQuest = activatedQuests[0]
      console.log(`✅ Próxima quest ${nextQuest.id} (${nextQuest.name}) ativada na Fase ${closedQuestData.phase_id}. Status: ${activatedQuest?.status}`)
      // ✅ REMOVIDO: revalidatePath() causa refresh em TODAS as abas simultâneas
      // Razão: Dados já vêm via polling (500ms) + BroadcastChannel
      // Resultado: live-dashboard atualiza suavemente sem refresh visual

      const response = NextResponse.json({
        success: true,
        message: `Quest ${closedQuestData.order_index} fechada. Quest ${nextQuest.order_index} ativada.`,
        questActivated: nextQuest.id,
        timestamp: Date.now() // Cache-busting timestamp
      }, { status: 200 })

      // Force fresh data fetch - no caching allowed
      response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0')
      return response
    } else {
      // Nenhuma próxima quest na fase atual, avançar para a próxima fase
      console.log(`ℹ️ Todas as quests da Fase ${closedQuestData.phase_id} concluídas. Tentando avançar para a próxima fase...`)

      const nextPhaseId = closedQuestData.phase_id + 1;
      const MAX_PHASE = 5 // Fase 5 é a última

      // Verificar se chegou ao final (Fase 5 completa = evento termina)
      if (nextPhaseId > MAX_PHASE) {
        console.log(`✅ Todas as quests da Fase 5 concluídas! Definindo intervalo de 1 minuto antes do game over.`)

        // IMPORTANTE: Não finalizar logo, esperar 1 minuto em MODO TESTE (normalmente 15 minutos para intervalo na live)
        // Isso permite que avaliadores preparem o ranking final
        const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'

        // FASE 1: Período de Avaliação (1 minuto em teste)
        // FASE 2: Countdown final (0 seg em teste - será setado manualmente depois)
        // Total: 1 minuto em teste (em produção seria 15 min para avaliação + 15 min countdown)
        const now = new Date()
        const evaluationPeriodEnd = new Date(now.getTime() + 60 * 1000) // +60 seg para avaliação (TESTE)
        const eventEndTime = new Date(evaluationPeriodEnd.getTime() + 0 * 1000) // +0 seg de countdown (TESTE) - será ajustado depois

        const evaluationPeriodTimestamp = evaluationPeriodEnd.toISOString()
        const eventEndTimestamp = eventEndTime.toISOString()

        console.log(`⏰ Período de avaliação: ${evaluationPeriodTimestamp}`)
        console.log(`⏰ Evento terminará em: ${eventEndTimestamp}`)

        const { error: eventEndError } = await supabaseAdmin
          .from('event_config')
          .update({
            event_ended: false, // Ainda não finalizado, apenas agendado
            evaluation_period_end_time: evaluationPeriodTimestamp, // ← ADICIONADO
            event_end_time: eventEndTimestamp // Tempo quando será finalizado
          })
          .eq('id', eventConfigId)

        if (eventEndError) {
          console.error('Erro ao agendar fim do evento:', eventEndError)
          return NextResponse.json(
            { error: 'Erro ao agendar fim do evento.' },
            { status: 500 }
          )
        }

        // ✅ REMOVIDO: revalidatePath() - polling detecta mudança automaticamente

        const response = NextResponse.json({
          success: true,
          message: `Todas as quests da Fase ${closedQuestData.phase_id} concluídas. Evento finalizará em 15 minutos.`,
          eventScheduledToEnd: true,
          eventEndTime: eventEndTimestamp,
          timestamp: Date.now() // Cache-busting timestamp
        }, { status: 200 })

        // Force fresh data fetch - no caching allowed
        response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0')
        return response
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
      } else if (firstQuestOfNewPhase && firstQuestOfNewPhase.id) {
        console.log(`📝 Tentando ativar primeira quest da nova fase: ${firstQuestOfNewPhase.id} (${firstQuestOfNewPhase.name})`)
        const { data: activatedFirstQuests, error: startError } = await supabaseAdmin
          .from('quests')
          .update({
            status: 'active',
            started_at: getUTCTimestamp()
          })
          .eq('id', firstQuestOfNewPhase.id)
          .select('id, name, status, started_at')

        if (startError) {
          console.error('❌ Erro ao ativar primeira quest da nova fase:', {
            code: startError.code,
            message: startError.message,
            details: startError.details,
            hint: startError.hint,
            questId: firstQuestOfNewPhase.id
          })
        } else if (!activatedFirstQuests || activatedFirstQuests.length === 0) {
          console.error('❌ Primeira quest update retornou 0 linhas!')
        } else {
          questsActivated = 1
          const activatedFirstQuest = activatedFirstQuests[0]
          console.log(`✅ Primeira quest da ${phaseNames[nextPhaseId]} ativada: ${firstQuestOfNewPhase.name} (Status: ${activatedFirstQuest?.status})`)
        }
      }

      console.log(`✅ Fase ${nextPhaseId} (${phaseNames[nextPhaseId]}) avançada automaticamente!`)
      // ✅ REMOVIDO: revalidatePath() - polling detecta mudança automaticamente

      const response = NextResponse.json({
        success: true,
        message: `Todas as quests da Fase ${closedQuestData.phase_id} concluídas. ${phaseNames[nextPhaseId]} iniciada com ${questsActivated} quest(s) ativada(s).`,
        phaseAdvanced: nextPhaseId,
        questsActivated,
        timestamp: Date.now() // Cache-busting timestamp
      }, { status: 200 })

      // Force fresh data fetch - no caching allowed
      response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0')
      return response
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
  } finally {
    // IMPORTANTE: Sempre limpar o lock para evitar deadlocks
    processingQuests.delete(questId)
    console.log(`✅ Quest ${questId} removida do processamento. (Total em processamento: ${processingQuests.size})`)
  }
}
