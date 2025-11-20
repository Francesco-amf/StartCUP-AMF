import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Buscar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar dados do avaliador
    const { data: evaluator, error: evaluatorError } = await supabase
      .from('evaluators')
      .select('*')
      .eq('email', user.email)
      .single()

    if (evaluatorError || !evaluator) {
      return NextResponse.json(
        { error: 'Avaliador não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      evaluator: {
        id: evaluator.id,
        name: evaluator.name,
        email: evaluator.email,
        specialty: evaluator.specialty
      }
    })
  } catch (error) {
    console.error('[/api/evaluator/me] Error:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
