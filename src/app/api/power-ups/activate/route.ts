import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('📍 [Power-Up API] Iniciando requisição')
    const supabase = await createServerSupabaseClient()

    // Obter usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('📍 [Power-Up API] Usuário não autenticado')
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    console.log('📍 [Power-Up API] Usuário autenticado:', user.email)

    // Obter dados do request
    const { powerUpType } = await request.json()
    console.log('📍 [Power-Up API] Power-up type:', powerUpType)

    const validPowerUpTypes = ['mentor_session', 'instant_feedback', 'checkpoint_review', 'revision_session']
    if (!powerUpType || !validPowerUpTypes.includes(powerUpType)) {
      return NextResponse.json(
        { error: 'Tipo de power-up inválido' },
        { status: 400 }
      )
    }

    // Buscar equipe do usuário
    console.log('📍 [Power-Up API] Buscando equipe para:', user.email)
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (teamError) {
      console.error('❌ [Power-Up API] Erro ao buscar equipe:', teamError)
      return NextResponse.json(
        { error: 'Erro ao buscar equipe' },
        { status: 500 }
      )
    }

    if (!team) {
      console.warn('⚠️ [Power-Up API] Equipe não encontrada para:', user.email)
      return NextResponse.json(
        { error: 'Equipe não encontrada' },
        { status: 404 }
      )
    }

    console.log('📍 [Power-Up API] Equipe encontrada:', team.id)

    // Obter fase atual
    const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'
    const { data: eventConfig, error: eventError } = await supabase
      .from('event_config')
      .select('current_phase')
      .eq('id', eventConfigId)
      .maybeSingle()

    if (eventError) {
      console.error('Erro ao buscar event config:', eventError)
      return NextResponse.json(
        { error: 'Erro ao buscar configuração do evento' },
        { status: 500 }
      )
    }

    if (!eventConfig) {
      return NextResponse.json(
        { error: 'Configuração do evento não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já usou power-up nesta fase
    const { data: existingPowerUp, error: checkError } = await supabase
      .from('power_ups')
      .select('id')
      .eq('team_id', team.id)
      .eq('phase_used', eventConfig.current_phase)
      .eq('status', 'used')
      .maybeSingle()

    if (checkError) {
      return NextResponse.json(
        { error: 'Erro ao verificar power-ups' },
        { status: 500 }
      )
    }

    if (existingPowerUp) {
      return NextResponse.json(
        { error: 'Você já usou um power-up nesta fase!' },
        { status: 403 }
      )
    }

    // Criar novo power-up
    const { data: newPowerUp, error: insertError } = await supabase
      .from('power_ups')
      .insert({
        team_id: team.id,
        power_up_type: powerUpType,
        phase_used: eventConfig.current_phase,
        status: 'used',
        used_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir power-up:', insertError)
      return NextResponse.json(
        { error: 'Erro ao ativar power-up' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      powerUp: newPowerUp,
      message: `Power-up ${powerUpType} ativado com sucesso!`
    })

  } catch (error) {
    console.error('Erro na ativação do power-up:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
