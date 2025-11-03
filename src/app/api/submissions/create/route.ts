'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const questId = formData.get('questId') as string
    const teamId = formData.get('teamId') as string
    const deliverableType = formData.get('deliverableType') as string
    const content = formData.get('content') as string
    const file = formData.get('file') as File | null

    // Validar entrada básica
    if (!questId || !teamId || !deliverableType) {
      return NextResponse.json(
        { error: 'Dados inválidos. Faltam questId, teamId ou deliverableType.' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Validar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Validar que a equipe pertence ao usuário (ou é admin)
    const userRole = user.user_metadata?.role
    if (userRole !== 'admin' && userRole !== 'team') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // ========================================
    // PASSO 1: Validar submissão usando função do banco
    // ========================================
    const { data: validationResult, error: validationError } = await supabase
      .rpc('validate_submission_allowed', {
        team_id_param: teamId,
        quest_id_param: questId
      })

    console.log('Validation Result:', validationResult);

    if (validationError) {
      console.error('Erro ao validar submissão:', validationError)
      return NextResponse.json(
        { error: 'Erro ao validar submissão' },
        { status: 400 }
      )
    }

    if (!validationResult?.is_allowed) {
      return NextResponse.json(
        {
          error: validationResult?.reason || 'Submissão não permitida',
          details: {
            allowed: false,
            reason: validationResult?.reason,
            lateMinutes: validationResult?.late_minutes_calculated || 0,
            penalty: validationResult?.penalty_calculated || 0
          }
        },
        { status: 400 }
      )
    }

    // ========================================
    // PASSO 2: Validar que quest anterior foi entregue
    // ========================================
    const { data: sequentialCheck, error: sequentialError } = await supabase
      .rpc('check_previous_quest_submitted', {
        team_id_param: teamId,
        quest_id_param: questId
      })

    if (sequentialError) {
      console.error('Erro ao validar sequência:', sequentialError)
    } else if (!sequentialCheck?.can_submit) {
      return NextResponse.json(
        {
          error: sequentialCheck?.reason || 'Você deve completar a quest anterior primeiro',
          details: {
            allowed: false,
            reason: sequentialCheck?.reason
          }
        },
        { status: 400 }
      )
    }

    // ========================================
    // PASSO 3: Buscar informações da quest
    // ========================================
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('id, name, deliverable_type, max_points')
      .eq('id', questId)
      .single()

    if (questError || !quest) {
      return NextResponse.json(
        { error: 'Quest não encontrada' },
        { status: 404 }
      )
    }

    // ========================================
    // PASSO 4: Validar tipo de entrega
    // ========================================
    if (deliverableType !== quest.deliverable_type) {
      return NextResponse.json(
        { error: `Tipo de entrega deve ser ${quest.deliverable_type}` },
        { status: 400 }
      )
    }

    let fileUrl: string | null = null

    // ========================================
    // PASSO 5: Fazer upload do arquivo (se aplicável)
    // ========================================
    if (deliverableType === 'file' && file) {
      // Validar tamanho do arquivo (50MB max)
      const maxFileSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `Arquivo muito grande. Máximo: 50MB, você enviou: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
          { status: 400 }
        )
      }

      // Validar tipo de arquivo
      const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
      ]

      if (!allowedMimes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Tipo de arquivo não permitido' },
          { status: 400 }
        )
      }

      // Fazer upload para Supabase Storage
      const timestamp = Date.now()
      const fileName = `${teamId}/${questId}/${timestamp}-${file.name}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError)
        return NextResponse.json(
          { error: 'Erro ao fazer upload do arquivo' },
          { status: 500 }
        )
      }

      // Gerar URL pública do arquivo
      const { data: publicData } = supabase.storage
        .from('submissions')
        .getPublicUrl(uploadData.path)

      fileUrl = publicData.publicUrl
    }

    // ========================================
    // PASSO 6: Verificar submissão duplicada
    // ========================================
    const { data: existingSubmission, error: checkError } = await supabase
      .from('submissions')
      .select('id')
      .eq('team_id', teamId)
      .eq('quest_id', questId)
      .single()

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Você já enviou uma entrega para esta quest' },
        { status: 400 }
      )
    }

    // ========================================
    // PASSO 7: Criar submissão no banco
    // ========================================
    const { data: submission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        team_id: teamId,
        quest_id: questId,
        content: deliverableType === 'text' ? content : null,
        file_url: fileUrl,
        status: 'pending',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar submissão:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar submissão' },
        { status: 500 }
      )
    }

    // ========================================
    // PASSO 8: Aplicar penalidade de atraso se necessário
    // ========================================
    let penaltyApplied = false
    let penaltyAmount = 0

    if (validationResult?.penalty_calculated && validationResult.penalty_calculated > 0) {
      const { error: penaltyError } = await supabase
        .from('penalties')
        .insert({
          team_id: teamId,
          penalty_type: 'atraso',
          points_deduction: validationResult.penalty_calculated,
          reason: `Submissão atrasada por ${validationResult.late_minutes_calculated} minutos na quest "${quest.name}"`,
          assigned_by_admin: true
        })

      if (!penaltyError) {
        penaltyApplied = true
        penaltyAmount = validationResult.penalty_calculated
      }
    }

    // ========================================
    // PASSO 9: Responder com sucesso
    // ========================================
    revalidatePath('/dashboard')

    return NextResponse.json(
      {
        success: true,
        message: 'Submissão criada com sucesso!',
        submission: {
          id: submission.id,
          questId: submission.quest_id,
          teamId: submission.team_id,
          status: submission.status,
          submittedAt: submission.submitted_at,
          fileUrl: fileUrl,
          isLate: validationResult?.late_minutes_calculated > 0,
          lateMinutes: validationResult?.late_minutes_calculated || 0,
          penaltyApplied: penaltyApplied,
          penaltyAmount: penaltyAmount
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erro fatal ao criar submissão:', error)
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
