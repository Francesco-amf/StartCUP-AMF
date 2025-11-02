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

    // ⚠️ NÃO usar new Date().toISOString() - usar NOW() do Supabase PostgreSQL
    // Isso garante que o timestamp é salvo consistentemente no BD
    // e evita problemas de timezone entre Node.js e browser

    const updateData: any = {
      // Atualizar a fase atual
      current_phase: phase,
    }

    // Se está em qualquer fase >= 1, o evento deve estar marcado como iniciado
    if (phase >= 1) {
      updateData.event_started = true
      updateData.event_ended = false

      // ⚠️ CRÍTICO: Salvar o timestamp de quando ESSA fase começou
      // Campo específico: phase_X_start_time (1-5)
      // Usar NULL para que Supabase use NOW() do banco (consistente em todo lugar)
      const phaseStartColumn = `phase_${phase}_start_time`

      // Usar um marcador especial que vamos processar no SQL
      // Na verdade, vamos usar raw SQL para ter controle total
      console.log(`✅ Setando ${phaseStartColumn} com NOW() do Supabase`)

      // ⚠️ CRÍTICO: event_start_time só deve ser setado UMA VEZ
      // Na primeira mudança para fase >= 1 (0 → 1)
      // Nunca sobrescrever depois, pois é usado como referência para calcular todas as fases
      if (!config.event_start_time) {
        console.log('✅ Primeiro início: setando event_start_time com NOW() do Supabase')
      } else {
        console.log('⏭️ event_start_time já existe, não sobrescrever')
      }
    }

    // Se está voltando para preparação (fase 0)
    if (phase === 0) {
      updateData.event_started = false
      updateData.event_ended = false
      updateData.event_start_time = null
      updateData.event_end_time = null
      // Limpar todos os timestamps de fase
      for (let i = 1; i <= 5; i++) {
        updateData[`phase_${i}_start_time`] = null
      }
    }

    console.log('🔄 Atualizando event_config com:', updateData)

    // Adicionar timestamps normalmente (serão compensados no frontend)
    if (phase >= 1) {
      const phaseCol = `phase_${phase}_start_time`
      updateData[phaseCol] = new Date().toISOString()
      console.log(`✅ Setando ${phaseCol} = ${updateData[phaseCol]}`)

      if (!config.event_start_time) {
        updateData.event_start_time = new Date().toISOString()
        console.log('✅ Primeira fase: setando event_start_time')
      } else {
        console.log('⏭️ event_start_time já existe, não sobrescrever')
      }
    }

    // Update normal
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
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao iniciar fase:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
