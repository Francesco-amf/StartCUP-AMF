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

    const { phase } = await request.json()

    if (!phase || phase < 1 || phase > 5) {
      return NextResponse.json(
        { error: 'Fase inválida' },
        { status: 400 }
      )
    }

    // Chamar função PostgreSQL para calcular custo
    const { data, error } = await supabase.rpc('calculate_mentor_request_cost', {
      p_team_id: team.id,
      p_phase: phase
    })

    if (error) {
      console.error('Erro ao calcular custo:', error)
      return NextResponse.json(
        { error: 'Erro ao calcular custo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ cost: data })

  } catch (error) {
    console.error('Erro no cálculo de custo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
