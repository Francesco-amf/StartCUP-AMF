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

    if (!pointsDeduction || pointsDeduction < 0 || pointsDeduction > 100) {
      return NextResponse.json(
        { error: 'Dedução de pontos deve estar entre 0 e 100' },
        { status: 400 }
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
        assigned_by_admin: true,
        assigned_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir penalidade:', insertError)
      return NextResponse.json(
        { error: 'Erro ao atribuir penalidade' },
        { status: 500 }
      )
    }

    console.log(`✅ Penalidade atribuída à equipe ${team.name}: ${penaltyType} (-${pointsDeduction}pts)`)

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
