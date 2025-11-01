import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verificar autenticação e permissão de admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { phase } = await request.json()
    console.log('📌 POST /api/admin/start-phase - Phase:', phase, 'User:', user.email)

    // Validar fase (0 = preparação, 1-5 = fases do evento)
    if (phase < 0 || phase > 5) {
      return NextResponse.json({ error: 'Fase inválida' }, { status: 400 })
    }

    // Usar service_role client para bypassar RLS
    const { createClient } = await import('@supabase/supabase-js')

    // Log das variáveis de ambiente
    console.log('🔍 SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔍 SERVICE_ROLE exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('🔍 EVENT_CONFIG_ID:', process.env.NEXT_PUBLIC_EVENT_CONFIG_ID)

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

    // Buscar config atual - usar fallback UUID direto
    const eventConfigId = '00000000-0000-0000-0000-000000000001'
    console.log('🔍 EventConfigId (hardcoded):', eventConfigId)
    console.log('🔍 Tentando buscar event_config com ID:', eventConfigId)

    const { data: config, error: configError } = await supabaseAdmin
      .from('event_config')
      .select('*')
      .eq('id', eventConfigId)
      .single()

    console.log('🔍 Query result:', { config, configError: configError ? { message: configError.message, code: configError.code, details: configError.details } : null })

    if (configError) {
      console.error('❌ Erro ao buscar config atual:', {
        message: configError.message,
        code: configError.code,
        details: configError.details,
        hint: configError.hint
      })
      return NextResponse.json(
        {
          error: 'Erro ao buscar configuração do evento',
          details: configError.message,
          code: configError.code,
          hint: configError.hint
        },
        { status: 500 }
      )
    }

    const now = new Date().toISOString()
    const updateData: any = {
      current_phase: phase,
      updated_at: now,
    }

    // Se está em qualquer fase >= 1, o evento deve estar marcado como iniciado
    if (phase >= 1) {
      updateData.event_started = true
      updateData.event_ended = false

      // SEMPRE atualizar event_start_time quando iniciar qualquer fase
      // Isso garante que o timer sempre comece do zero
      updateData.event_start_time = now
    }

    // Registrar horário de início de cada fase
    // SEMPRE atualiza o timestamp quando muda para uma fase
    if (phase === 1) {
      updateData.phase_1_start_time = now
    }
    if (phase === 2) {
      updateData.phase_2_start_time = now
    }
    if (phase === 3) {
      updateData.phase_3_start_time = now
    }
    if (phase === 4) {
      updateData.phase_4_start_time = now
    }
    if (phase === 5) {
      updateData.phase_5_start_time = now
    }

    // Se está voltando para preparação (fase 0)
    if (phase === 0) {
      updateData.event_started = false
      updateData.event_ended = false
      // Resetar timestamps se voltar para preparação
      updateData.event_start_time = null
      updateData.event_end_time = null
      updateData.phase_1_start_time = null
      updateData.phase_2_start_time = null
      updateData.phase_3_start_time = null
      updateData.phase_4_start_time = null
      updateData.phase_5_start_time = null
    }

    console.log('🔄 Atualizando event_config com:', updateData)

    // Atualizar configuração usando service_role (bypassa RLS)
    const { error, data: updatedData } = await supabaseAdmin
      .from('event_config')
      .update(updateData)
      .eq('id', eventConfigId)
      .select()

    if (error) {
      console.error('❌ Erro ao atualizar fase:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar fase', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Event config atualizado:', updatedData)

    const phaseNames = [
      'Preparação',
      'Fase 1: Descoberta',
      'Fase 2: Criação',
      'Fase 3: Estratégia',
      'Fase 4: Refinamento',
      'Fase 5: Pitch Final'
    ]

    console.log(`✅ Evento atualizado para: ${phaseNames[phase]}`)

    return NextResponse.json({
      success: true,
      message: `Evento atualizado para: ${phaseNames[phase]}`,
      phase,
      timestamp: now
    })

  } catch (error) {
    console.error('Erro ao iniciar fase:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
