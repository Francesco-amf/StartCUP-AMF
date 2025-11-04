import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar team_id do usuário
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('email', user.email)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Equipe não encontrada' },
        { status: 404 }
      )
    }

    const { mentorId, phase, notes } = await request.json()

    // Validações básicas
    if (!mentorId) {
      return NextResponse.json(
        { error: 'Mentor não selecionado' },
        { status: 400 }
      )
    }

    if (!phase || phase < 1 || phase > 5) {
      return NextResponse.json(
        { error: 'Fase inválida' },
        { status: 400 }
      )
    }

    // Verificar se mentor existe e é avaliador
    const { data: mentor, error: mentorError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('id', mentorId)
      .eq('course', 'Avaliação')
      .single()

    if (mentorError || !mentor) {
      return NextResponse.json(
        { error: 'Mentor não encontrado ou inválido' },
        { status: 404 }
      )
    }

    // Chamar função PostgreSQL para criar solicitação
    const { data, error } = await supabase.rpc('request_mentor', {
      p_team_id: team.id,
      p_mentor_id: mentorId,
      p_phase: phase,
      p_notes: notes || null
    })

    if (error) {
      console.error('Erro ao solicitar mentor:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao criar solicitação' },
        { status: 500 }
      )
    }

    // Verificar se a função retornou erro
    if (data && !data.success) {
      return NextResponse.json(
        { error: data.error || 'Erro ao criar solicitação' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      ...data
    })

  } catch (error) {
    console.error('Erro ao solicitar mentor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
