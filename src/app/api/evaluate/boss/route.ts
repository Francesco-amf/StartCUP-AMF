import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('🔥 [BOSS API] Starting request...')
    
    let supabase
    try {
      supabase = await createServerSupabaseClient()
      console.log('✅ [BOSS API] Supabase client created')
    } catch (err) {
      console.error('❌ [BOSS API] Failed to create Supabase client:', err)
      return NextResponse.json(
        { error: 'Failed to create Supabase client', details: String(err) },
        { status: 500 }
      )
    }
    
    let body
    try {
      body = await request.json()
      console.log('✅ [BOSS API] Body parsed:', body)
    } catch (err) {
      console.error('❌ [BOSS API] Failed to parse body:', err)
      return NextResponse.json(
        { error: 'Failed to parse request body', details: String(err) },
        { status: 400 }
      )
    }

    const { team_id, quest_id, points, comments, evaluator_id } = body

    console.log('🔥 [BOSS API] Boss evaluation request:', { team_id, quest_id, points, comments, evaluator_id })

    // Validação básica
    if (!team_id || !quest_id || !evaluator_id || points === undefined || points === null) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      )
    }

    if (points < 0 || points > 100) {
      return NextResponse.json(
        { error: 'Pontos devem estar entre 0 e 100' },
        { status: 400 }
      )
    }

    // Verificar se quest é realmente Boss
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('id, name, max_points, deliverable_type, order_index')
      .eq('id', quest_id)
      .single()

    if (questError || !quest) {
      return NextResponse.json(
        { error: 'Quest não encontrada' },
        { status: 404 }
      )
    }

    const isBoss = 
      (Array.isArray(quest.deliverable_type) 
        ? quest.deliverable_type.includes('presentation')
        : quest.deliverable_type === 'presentation'
      ) || quest.order_index === 4

    if (!isBoss) {
      return NextResponse.json(
        { error: 'Esta quest não é um Boss Battle' },
        { status: 400 }
      )
    }

    console.log('✅ Quest verified as Boss:', quest)

    // Verificar se já existe submission desta equipe para esta quest
    console.log('🔍 [BOSS API] Checking for existing submission...', { team_id, quest_id })
    const { data: existingSubmission, error: checkError } = await supabase
      .from('submissions')
      .select('id')
      .eq('team_id', team_id)
      .eq('quest_id', quest_id)
      .maybeSingle()

    console.log('🔍 [BOSS API] Existing submission check:', { existingSubmission, checkError })

    let submission_id: string

    if (existingSubmission) {
      // Submission já existe, usar ela
      submission_id = existingSubmission.id
      console.log('📝 [BOSS API] Using existing submission:', submission_id)
    } else {
      // Criar submission automaticamente usando service role client (bypass RLS)
      console.log('🔨 [BOSS API] Creating new submission for Boss...')
      console.log('🔨 [BOSS API] Submission data:', { team_id, quest_id })
      
      let supabaseAdmin
      try {
        supabaseAdmin = createServiceRoleClient()
        console.log('✅ [BOSS API] Service role client created')
      } catch (err) {
        console.error('❌ [BOSS API] Failed to create service role client:', err)
        return NextResponse.json(
          { error: 'Failed to create admin client', details: String(err) },
          { status: 500 }
        )
      }
      
      const { data: newSubmission, error: submissionError } = await supabaseAdmin
        .from('submissions')
        .insert({
          team_id,
          quest_id,
          file_url: null,
          content: 'Boss Battle - Apresentação Presencial',
          status: 'pending',
          submitted_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      console.log('🔨 [BOSS API] Submission creation result:', { newSubmission, submissionError })

      if (submissionError) {
        console.error('❌ Error creating submission:', submissionError)
        console.error('❌ Full error:', JSON.stringify(submissionError, null, 2))
        return NextResponse.json(
          { 
            error: 'Erro ao criar submission', 
            details: submissionError?.message,
            code: submissionError?.code,
            hint: submissionError?.hint 
          },
          { status: 500 }
        )
      }

      if (!newSubmission) {
        console.error('❌ No submission returned after insert')
        return NextResponse.json(
          { error: 'Submission não foi criada (sem dados retornados)' },
          { status: 500 }
        )
      }

      submission_id = newSubmission.id
      console.log('✅ [BOSS API] Created submission:', submission_id)
    }

    // Criar ou atualizar avaliação usando cliente NORMAL (como na API /api/evaluate)
    console.log('💾 [BOSS API] Saving evaluation...', { submission_id, evaluator_id, points })
    console.log('💾 [BOSS API] Evaluation data:', {
      submission_id,
      evaluator_id,
      points,
      base_points: points,
      multiplier: 1.0,
      comments: comments || null
    })
    
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .upsert({
        submission_id,
        evaluator_id,
        points, // Boss: pontos diretos (sem multiplicador)
        base_points: points,
        multiplier: 1.0, // Boss sempre 1.0
        comments: comments || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'submission_id,evaluator_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    console.log('💾 [BOSS API] Evaluation save result:', { evaluation, evalError })

    if (evalError) {
      console.error('❌ Error creating evaluation:', evalError)
      console.error('❌ Full error:', JSON.stringify(evalError, null, 2))
      return NextResponse.json(
        { 
          error: 'Erro ao salvar avaliação', 
          details: evalError.message,
          code: evalError.code,
          hint: evalError.hint 
        },
        { status: 500 }
      )
    }

    console.log('✅ Evaluation saved:', evaluation)

    // Buscar todas as avaliações desta submission para calcular média
    const { data: allEvaluations } = await supabase
      .from('evaluations')
      .select('points')
      .eq('submission_id', submission_id)

    console.log('📊 All evaluations for this submission:', allEvaluations)

    let finalPoints = points

    // Calcular pontos finais (média das avaliações)
    if (allEvaluations && allEvaluations.length > 0) {
      const totalPoints = allEvaluations.reduce((sum: number, e: { points: number | null }) => sum + (e.points || 0), 0)
      finalPoints = Math.round(totalPoints / allEvaluations.length)

      console.log('🔢 Calculating final points:', {
        totalPoints,
        evaluationsCount: allEvaluations.length,
        finalPoints
      })
    }

    // Atualizar submission com pontos finais usando service role (bypass RLS)
    const supabaseAdmin = createServiceRoleClient()
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        final_points: finalPoints,
        status: 'evaluated',
      })
      .eq('id', submission_id)

    if (updateError) {
      console.error('⚠️ Error updating submission final_points:', updateError)
    }

    console.log('✅ Boss evaluation complete:', { submission_id, finalPoints })

    return NextResponse.json({
      success: true,
      message: 'Boss Battle avaliado com sucesso',
      submission_id,
      evaluation_id: evaluation.id,
      points: finalPoints
    })
  } catch (error: any) {
    console.error('❌ [BOSS API] Server error:', error)
    console.error('❌ [BOSS API] Error stack:', error?.stack)
    console.error('❌ [BOSS API] Error message:', error?.message)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error?.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}
