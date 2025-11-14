import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const formData = await request.formData()

    const submission_id = formData.get('submission_id') as string
    const evaluator_id = formData.get('evaluator_id') as string
    const base_points = parseInt(formData.get('base_points') as string) || 0
    const multiplier = parseFloat(formData.get('multiplier') as string) || 1.0
    const comments = formData.get('comments') as string
    const is_update = formData.get('is_update') === 'true'

    // Buscar a submission e quest para validar e detectar Boss
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        quest:quest_id(
          max_points,
          deliverable_type,
          order_index
        )
      `)
      .eq('id', submission_id)
      .single()

    console.log('📦 Submission lookup:', { submission, submissionError })

    if (!submission || !submission.quest) {
      return NextResponse.json(
        { error: 'Submission não encontrada' },
        { status: 404 }
      )
    }

    // Detectar se é Boss (apresentação)
    const isBoss = 
      (Array.isArray(submission.quest.deliverable_type) 
        ? submission.quest.deliverable_type.includes('presentation')
        : submission.quest.deliverable_type === 'presentation'
      ) || submission.quest.order_index === 4

    console.log('🎯 Quest type detection:', {
      deliverable_type: submission.quest.deliverable_type,
      order_index: submission.quest.order_index,
      isBoss
    })

    // Calcular AMF Coins finais
    // Boss: apenas base (sem multiplicador)
    // Regular: base * multiplicador
    const calculated_points = isBoss 
      ? base_points
      : Math.round(base_points * multiplier)

    console.log('� Received evaluation data:', {
      submission_id,
      evaluator_id,
      base_points,
      multiplier,
      isBoss,
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

    const maxPoints = submission.quest?.max_points || 0
    if (base_points > maxPoints) {
      return NextResponse.json(
        { error: `AMF Coins base máximo é ${maxPoints}` },
        { status: 400 }
      )
    }

    // Inserir ou atualizar avaliação (UPSERT automático)
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
      // UPSERT: Inserir nova avaliação ou atualizar se já existir
      // Usa onConflict para evitar erro de duplicate key
      const result = await supabase
        .from('evaluations')
        .upsert({
          submission_id,
          evaluator_id,
          points: calculated_points,
          base_points,
          multiplier,
          comments: comments || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'submission_id,evaluator_id',
          ignoreDuplicates: false // Atualiza se existir
        })
        .select()
        .single()

      evaluation = result.data
      evalError = result.error
      
      console.log('💾 Upsert result:', { evaluation, evalError })
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

    // Variável para armazenar pontos finais
    let finalPoints = calculated_points

    // Calcular AMF Coins médios
    if (allEvaluations && allEvaluations.length > 0) {
      const totalPoints = allEvaluations.reduce((sum: number, e: { points: number | null }) => sum + (e.points || 0), 0)
      const avgPoints = Math.round(totalPoints / allEvaluations.length)

      console.log('🔢 Calculating final points:', {
        totalPoints,
        evaluationsCount: allEvaluations.length,
        avgPoints
      })

      // ========================================
      // VERIFICAR SE É ATRASADA E SUBTRAIR PENALIDADE
      // ========================================
      finalPoints = avgPoints

      if (submission.is_late && submission.late_penalty_applied) {
        finalPoints = avgPoints - submission.late_penalty_applied
        console.log('⚠️  Late submission detected:', {
          avgPoints,
          late_penalty_applied: submission.late_penalty_applied,
          finalPoints
        })
      }

      // Atualizar submission com AMF Coins finais
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          final_points: finalPoints,
          status: 'evaluated',
        })
        .eq('id', submission_id)

      console.log('✏️ Updated submission:', { avgPoints, finalPoints, is_late: submission.is_late, late_penalty: submission.late_penalty_applied, updateError })

      if (updateError) {
        console.error('❌ Error updating submission:', updateError)
      }
    }

    // ✅ REMOVIDO: Redirect causava page reload
    // Agora: Retornar sucesso (200) e deixar polling atualizar dados
    // Cliente (JS) usa useRealtimeRanking para atualização em tempo real
    return NextResponse.json({
      success: true,
      message: 'Avaliação salva com sucesso',
      submission_id,
      final_points: finalPoints
    })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
