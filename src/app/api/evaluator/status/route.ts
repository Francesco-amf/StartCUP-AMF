import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verificar autenticação e permissão de avaliador
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'evaluator') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { isOnline } = await request.json()

    // Validar campo isOnline
    if (typeof isOnline !== 'boolean') {
      return NextResponse.json({ error: 'Campo isOnline inválido' }, { status: 400 })
    }

    // Buscar avaliador pelo email do usuário autenticado
    const { data: evaluator, error: fetchError } = await supabase
      .from('evaluators')
      .select('*')
      .eq('email', user.email)
      .single()

    if (fetchError || !evaluator) {
      return NextResponse.json({ error: 'Avaliador não encontrado' }, { status: 404 })
    }

    // Atualizar status do avaliador
    const { error: updateError, data: updatedEvaluator } = await supabase
      .from('evaluators')
      .update({ is_online: isOnline })
      .eq('id', evaluator.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar status:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar status', details: updateError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Avaliador ${evaluator.name} agora está ${isOnline ? 'online' : 'offline'}`)

    return NextResponse.json({
      success: true,
      message: `Status atualizado para ${isOnline ? 'online' : 'offline'}`,
      evaluator: {
        id: updatedEvaluator.id,
        name: updatedEvaluator.name,
        email: updatedEvaluator.email,
        specialty: updatedEvaluator.specialty,
        is_online: updatedEvaluator.is_online
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
