import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const formData = await request.formData()

    const submission_id = formData.get('submission_id') as string
    const evaluator_id = formData.get('evaluator_id') as string
    const base_points = parseInt(formData.get('base_points') as string) || 0
    const bonus_points = parseInt(formData.get('bonus_points') as string) || 0
    const multiplier = parseFloat(formData.get('multiplier') as string) || 1.0
    const comments = formData.get('comments') as string
    const is_update = formData.get('is_update') === 'true'

    // Calcular pontuação final: (base + bonus) * multiplier
    const calculated_points = Math.round((base_points + bonus_points) * multiplier)

    console.log('📝 Received evaluation data:', {
      submission_id,
      evaluator_id,
      base_points,
      bonus_points,
      multiplier,
      calculated_points,
      comments,
      is_update
    })

    // Validação básica
    if (!submission_id || !evaluator_id || isNaN(base_points)) {
      console.error('❌ Invalid data:', { submission_id, evaluator_id, base_points })
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Buscar a submission para validar pontuação máxima
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*, quest:quest_id(max_points)')
      .eq('id', submission_id)
      .single()

    console.log('📦 Submission lookup:', { submission, submissionError })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission não encontrada' },
        { status: 404 }
      )
    }

    const maxPoints = submission.quest?.max_points || 0
    if (base_points > maxPoints) {
      return NextResponse.json(
        { error: `Pontuação base máxima é ${maxPoints}` },
        { status: 400 }
      )
    }

    // Inserir ou atualizar avaliação
    let evaluation
    let evalError

    if (is_update) {
      // Primeiro, verificar se a avaliação existe
      const { data: checkEval, error: checkError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('submission_id', submission_id)
        .eq('evaluator_id', evaluator_id)

      console.log('🔍 Checking existing evaluation:', {
        submission_id,
        evaluator_id,
        checkEval,
        checkError,
        count: checkEval?.length
      })

      if (!checkEval || checkEval.length === 0) {
        return NextResponse.json(
          {
            error: 'Nenhuma avaliação encontrada para atualizar',
            details: `Não foi encontrada avaliação para submission_id=${submission_id} e evaluator_id=${evaluator_id}`,
            debug: { submission_id, evaluator_id }
          },
          { status: 404 }
        )
      }

      // Atualizar avaliação existente
      const result = await supabase
        .from('evaluations')
        .update({
          points: calculated_points,
          base_points,
          bonus_points,
          multiplier,
          comments: comments || null,
          updated_at: new Date().toISOString(),
        })
        .eq('submission_id', submission_id)
        .eq('evaluator_id', evaluator_id)
        .select()

      evaluation = result.data?.[0] // Pega o primeiro resultado
      evalError = result.error

      console.log('📝 Update result:', { evaluation, evalError, updatedCount: result.data?.length })
    } else {
      // Inserir nova avaliação
      const result = await supabase
        .from('evaluations')
        .insert({
          submission_id,
          evaluator_id,
          points: calculated_points,
          base_points,
          bonus_points,
          multiplier,
          comments: comments || null,
        })
        .select()
        .single()

      evaluation = result.data
      evalError = result.error
    }

    console.log('✅ Evaluation result:', { evaluation, evalError, is_update })

    if (evalError) {
      console.error('❌ Erro ao salvar avaliação:', evalError)
      return NextResponse.json(
        { error: 'Erro ao salvar avaliação', details: evalError.message },
        { status: 500 }
      )
    }

    // Buscar todas as avaliações desta submission
    const { data: allEvaluations } = await supabase
      .from('evaluations')
      .select('points')
      .eq('submission_id', submission_id)

    console.log('📊 All evaluations:', allEvaluations)

    // Calcular pontuação média
    if (allEvaluations && allEvaluations.length > 0) {
      const totalPoints = allEvaluations.reduce((sum: number, e: { points: number | null }) => sum + (e.points || 0), 0)
      const avgPoints = Math.round(totalPoints / allEvaluations.length)

      console.log('🔢 Calculating final points:', {
        totalPoints,
        evaluationsCount: allEvaluations.length,
        avgPoints
      })

      // Atualizar submission com pontuação final
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          final_points: avgPoints,
          status: 'evaluated',
        })
        .eq('id', submission_id)

      console.log('✏️ Updated submission:', { avgPoints, updateError })

      if (updateError) {
        console.error('❌ Error updating submission:', updateError)
      }
    }

    // Redirecionar de volta para a página de avaliações
    return NextResponse.redirect(new URL('/evaluate', request.url))
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
