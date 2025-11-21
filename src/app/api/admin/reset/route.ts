import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    const userRole = user.user_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem resetar o sistema.' },
        { status: 403 }
      )
    }

    // Ler o corpo da requisição para verificar confirmação
    const body = await request.json()
    const { confirmationText } = body

    if (confirmationText !== 'RESETAR TUDO') {
      return NextResponse.json(
        { error: 'Texto de confirmação incorreto' },
        { status: 400 }
      )
    }

    console.log('🔥 INICIANDO RESET DO SISTEMA - Usuário:', user.email)

    // Tentar usar função RPC primeiro (se existir)
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('reset_system_data')

    if (!rpcError) {
      // Função RPC funcionou!
      console.log('✅ RESET COMPLETO via RPC:', rpcResult)
      return NextResponse.json({
        success: true,
        message: 'Sistema resetado com sucesso! Todas as avaliações, submissões, power-ups, penalidades e dados de evento foram removidos. O evento voltou para o modo de preparação (Fase 0).',
        details: rpcResult
      })
    }

    // Se RPC não existe, usar método alternativo (DELETE direto com service role)
    console.log('⚠️ RPC não encontrada, usando método alternativo...')

    const results: any = {}
    let totalDeleted = 0

    // Criar cliente com service_role (bypassa RLS)
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

    // 1. Deletar coin_adjustments PRIMEIRO
    console.log('🔄 Deletando coin_adjustments...')
    const { error: coinAdjError, count: coinAdjCount } = await supabaseAdmin
      .from('coin_adjustments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (!coinAdjError && coinAdjCount) {
      console.log('✅ Coin adjustments deletados:', coinAdjCount)
      results.coin_adjustments_deleted = coinAdjCount
      totalDeleted += coinAdjCount
    }

    // 2. Deletar mentor_requests (histórico de mentorias)
    console.log('🔄 Deletando mentor_requests...')
    const { error: mentorError, count: mentorCount } = await supabaseAdmin
      .from('mentor_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (!mentorError && mentorCount) {
      console.log('✅ Mentor requests deletados:', mentorCount)
      results.mentor_requests_deleted = mentorCount
      totalDeleted += mentorCount
    }

    // 3. Deletar penalidades
    console.log('🔄 Deletando penalties...')
    const { error: penaltyError, count: penaltyCount } = await supabaseAdmin
      .from('penalties')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (!penaltyError && penaltyCount) {
      console.log('✅ Penalties deletadas:', penaltyCount)
      results.penalties_deleted = penaltyCount
      totalDeleted += penaltyCount
    }

    // 4. Deletar evaluations
    console.log('🔄 Deletando evaluations...')
    const { error: evalError, count: evalCount } = await supabaseAdmin
      .from('evaluations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (!evalError && evalCount) {
      console.log('✅ Evaluations deletadas:', evalCount)
      results.evaluations_deleted = evalCount
      totalDeleted += evalCount
    }

    // 5. Deletar submissions
    console.log('🔄 Deletando submissions...')
    const { error: submError, count: submCount } = await supabaseAdmin
      .from('submissions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (!submError && submCount) {
      console.log('✅ Submissions deletadas:', submCount)
      results.submissions_deleted = submCount
      totalDeleted += submCount
    }

    // 6. Deletar power_ups
    console.log('🔄 Deletando power_ups...')
    const { error: powerupError, count: powerupCount } = await supabaseAdmin
      .from('power_ups')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (!powerupError && powerupCount) {
      console.log('✅ Power-ups deletados:', powerupCount)
      results.power_ups_deleted = powerupCount
      totalDeleted += powerupCount
    }

    // 7. Deletar equipes de teste (admin, avaliadores fake)
    console.log('🔄 Deletando equipes de teste...')
    const { error: teamError, count: teamCount } = await supabaseAdmin
      .from('teams')
      .delete()
      .in('email', ['admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com'])

    if (!teamError && teamCount) {
      console.log('✅ Equipes de teste deletadas:', teamCount)
      results.test_teams_deleted = teamCount
      totalDeleted += teamCount
    }

    // 8. Resetar event_config (se existir)
    const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'
    const { error: eventError } = await supabaseAdmin
      .from('event_config')
      .update({
        current_phase: 0,
        event_started: false,
        event_ended: false,
        phase_1_start_time: null,
        phase_2_start_time: null,
        phase_3_start_time: null,
        phase_4_start_time: null,
        phase_5_start_time: null,
        event_start_time: null,
        event_end_time: null,
        evaluation_period_end_time: null,
        all_submissions_evaluated: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventConfigId)

    if (!eventError) {
      console.log('✅ Event config resetado')
      results.event_reset = true
    }

    // 9. Resetar quests (CRÍTICO - limpa started_at e ended_at para evitar quests expiradas e dados fantasmas)
    console.log('🔄 Resetando quests...')
    const { error: questError, count: questCount } = await supabaseAdmin
      .from('quests')
      .update({
        status: 'scheduled',
        started_at: null,
        ended_at: null,
        started_by: null
      })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (!questError && questCount) {
      console.log('✅ Quests resetadas:', questCount)
      results.quests_reset = questCount
    }

    console.log('✅ RESET COMPLETO - Total deletado:', totalDeleted)

    return NextResponse.json({
      success: true,
      message: `Sistema resetado com sucesso! ${totalDeleted} registros foram removidos. Avaliações, submissões, power-ups e penalidades foram deletadas. O evento voltou para o modo de preparação (Fase 0).`,
      details: results
    })

  } catch (error) {
    console.error('❌ Erro fatal no reset:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
