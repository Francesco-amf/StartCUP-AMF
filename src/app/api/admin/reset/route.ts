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

    // 1. Deletar evaluations
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

    // 2. Deletar submissions
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

    // 2.5. Deletar power_ups
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

    // 3. Resetar event_config (se existir)
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
        updated_at: new Date().toISOString()
      })
      .eq('id', eventConfigId)

    if (!eventError) {
      console.log('✅ Event config resetado')
      results.event_reset = true
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
