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
    const { data: nextQuest, error: nextQuestError } = await supabaseAdmin
      .from('quests')
      .select('id, name, order_index')
      .eq('phase_id', currentQuest.phase_id)
      .eq('order_index', currentQuest.order_index + 1)
      .single()

    if (nextQuestError && nextQuestError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Erro ao buscar próxima quest:', nextQuestError)
      return NextResponse.json(
        { error: 'Erro ao buscar próxima quest.' },
        { status: 500 }
      )
    }

    if (nextQuest) {
      // Ativar a próxima quest na mesma fase
      const { error: startNextQuestError } = await supabaseAdmin
        .from('quests')
        .update({ status: 'active', started_at: getUTCTimestamp() })
        .eq('id', nextQuest.id)

      if (startNextQuestError) {
        console.error('Erro ao ativar próxima quest:', startNextQuestError)
        return NextResponse.json(
          { error: 'Erro ao ativar próxima quest.' },
          { status: 500 }
        )
      }
      console.log(`✅ Próxima quest ${nextQuest.id} (${nextQuest.name}) ativada na Fase ${currentQuest.phase_id}.`)
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

      // Chamar o endpoint existente para iniciar a próxima fase
      const nextPhaseId = currentQuest.phase_id + 1;
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/start-phase-with-quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: nextPhaseId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro ao avançar para a próxima fase:', errorData);
        return NextResponse.json(
          { error: errorData.message || 'Erro ao avançar para a próxima fase.' },
          { status: response.status }
        );
      }

      const phaseAdvanceData = await response.json();
      console.log(`✅ Fase ${nextPhaseId} avançada automaticamente.`) 
      revalidatePath('/dashboard')
      revalidatePath('/submit')
      return NextResponse.json({
        success: true,
        message: `Todas as quests da Fase ${currentQuest.phase_id} concluídas. ${phaseAdvanceData.message}`,
        phaseAdvanced: nextPhaseId,
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
