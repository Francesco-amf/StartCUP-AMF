import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // Obter usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { teamId, penaltyType, pointsDeduction, reason, phaseApplied } = body

    // Validar entrada
    const validPenaltyTypes = ['plagio', 'desorganizacao', 'desrespeito', 'ausencia', 'atraso']
    if (!teamId || !penaltyType || !validPenaltyTypes.includes(penaltyType)) {
      return NextResponse.json(
        { error: 'Dados de penalidade inválidos' },
        { status: 400 }
      )
    }

    if (pointsDeduction === null || pointsDeduction === undefined || pointsDeduction < 5 || pointsDeduction > 100) {
      return NextResponse.json(
        { error: 'Dedução de pontos deve estar entre 5 e 100' },
        { status: 400 }
      )
    }

    // Buscar o avaliador autenticado
    const { data: evaluator, error: evaluatorError } = await supabase
      .from('evaluators')
      .select('id, name')
      .eq('email', user.email)
      .single()

    if (evaluatorError || !evaluator) {
      return NextResponse.json(
        { error: 'Avaliador não encontrado' },
        { status: 404 }
      )
    }

    // Usar service_role client para bypassar RLS
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

    // Verificar se a equipe existe
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name')
      .eq('id', teamId)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Equipe não encontrada' },
        { status: 404 }
      )
    }

    // Criar a penalidade
    const { data: penalty, error: insertError } = await supabaseAdmin
      .from('penalties')
      .insert({
        team_id: teamId,
        penalty_type: penaltyType,
        points_deduction: pointsDeduction,
        reason: reason || null,
        phase_applied: phaseApplied || null,
        assigned_by_admin: false,
        assigned_by_evaluator_id: evaluator.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir penalidade:', insertError.message)
      return NextResponse.json(
        { error: 'Erro ao atribuir penalidade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      penalty,
      message: `Penalidade aplicada à ${team.name}: -${pointsDeduction} pontos`
    })

  } catch (error) {
    console.error('Erro ao atribuir penalidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
