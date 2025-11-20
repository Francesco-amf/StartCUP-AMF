import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const supabaseAdmin = createServiceRoleClient() // For bypassing RLS
    const body = await request.json()

    const { team_id, quest_id, points, comments, evaluator_id } = body

    console.log('🔥 Boss evaluation request:', { team_id, quest_id, points, comments, evaluator_id })

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
    const { data: existingSubmission, error: checkError } = await supabase
      .from('submissions')
      .select('id')
      .eq('team_id', team_id)
      .eq('quest_id', quest_id)
      .maybeSingle() // Use maybeSingle() instead of single() to avoid error when not found

    let submission_id: string

    if (existingSubmission) {
      // Submission já existe, usar ela
      submission_id = existingSubmission.id
      console.log('📝 Using existing submission:', submission_id)
    } else {
      // Criar submission automaticamente
      console.log('🔨 Creating new submission for Boss...')
      
      // Use admin client to bypass RLS for submission creation
      const { data: newSubmission, error: submissionError } = await supabaseAdmin
        .from('submissions')
        .insert({
          team_id,
          quest_id,
          file_url: null,
          text_content: 'Boss Battle - Apresentação Presencial',
          status: 'evaluated',
          submitted_at: new Date().toISOString(),
          final_points: points, // Boss não tem multiplicador, pontos diretos
        })
        .select('id')
        .single()

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
      console.log('✅ Created submission:', submission_id)
    }

    // Criar ou atualizar avaliação
    console.log('💾 Saving evaluation...', { submission_id, evaluator_id, points })
    
    // Use admin client to bypass RLS for evaluation creation/update
    const { data: evaluation, error: evalError } = await supabaseAdmin
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

    // Atualizar submission com pontos finais (caso já existisse)
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        final_points: points,
        status: 'evaluated',
      })
      .eq('id', submission_id)

    if (updateError) {
      console.error('⚠️ Error updating submission final_points:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Boss Battle avaliado com sucesso',
      submission_id,
      evaluation_id: evaluation.id,
      points
    })
  } catch (error) {
    console.error('❌ Server error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
