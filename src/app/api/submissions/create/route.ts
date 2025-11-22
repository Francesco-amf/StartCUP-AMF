import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
// ✅ REMOVIDO: revalidatePath - polling detecta mudanças automaticamente

// Configurar limite de request para 100MB (padrão Vercel é 5MB)
export const config = {
  maxDuration: 120,
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}

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
    const { data: validationResults, error: validationError } = await supabase
      .rpc('validate_submission_allowed', {
        team_id_param: teamId,
        quest_id_param: questId
      })

    console.log('Validation Results:', validationResults);

    if (validationError) {
      console.error('Erro ao validar submissão:', validationError)
      return NextResponse.json(
        { error: 'Erro ao validar submissão' },
        { status: 400 }
      )
    }

    // RPC retorna array de objetos, pegar primeiro elemento
    const validationResult = Array.isArray(validationResults) ? validationResults[0] : validationResults;

    console.log('Validation Result (parsed):', validationResult);
    console.log('penalty_calculated:', validationResult?.penalty_calculated);
    console.log('is_allowed:', validationResult?.is_allowed);

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
      .select('id, name, deliverable_type, max_points, order_index')
      .eq('id', questId)
      .single()

    if (questError || !quest) {
      return NextResponse.json(
        { error: 'Quest não encontrada' },
        { status: 404 }
      )
    }

    // ========================================
    // PASSO 4: Validar tipo de entrega e bloquear BOSS (apresentação ao vivo)
    // ========================================
    let questDeliverableTypes = quest.deliverable_type;
    
    // Se vier como string JSON, fazer parse
    if (typeof questDeliverableTypes === 'string') {
      try {
        questDeliverableTypes = JSON.parse(questDeliverableTypes);
      } catch (e) {
        console.error('❌ Erro ao fazer parse de deliverable_type no backend:', e);
        questDeliverableTypes = [questDeliverableTypes];
      }
    }
    
    // Garantir que é array
    if (!Array.isArray(questDeliverableTypes)) {
      questDeliverableTypes = questDeliverableTypes ? [questDeliverableTypes] : [];
    }

    console.log('🔍 [API] Quest deliverable_types:', questDeliverableTypes);
    console.log('🔍 [API] Tipo solicitado:', deliverableType);

    // BOSS quest: não aceita submissões digitais
    if (questDeliverableTypes.includes('presentation')) {
      return NextResponse.json(
        { error: 'Esta é uma BOSS Quest (apresentação ao vivo). Não é necessária submissão digital.' },
        { status: 400 }
      )
    }

    // Validar se o tipo solicitado é permitido para esta quest
    if (!questDeliverableTypes.includes(deliverableType)) {
      return NextResponse.json(
        { error: `Tipo de entrega inválido. Permitidos: ${JSON.stringify(questDeliverableTypes)}` },
        { status: 400 }
      )
    }

    let fileUrl: string | null = null

    // ========================================
    // PASSO 5: Fazer upload do arquivo (se aplicável)
    // ========================================
    if (deliverableType === 'file' && file) {
      // Validar tamanho do arquivo (5MB max - limite Vercel)
      const maxFileSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `Arquivo muito grande. Máximo: 5MB, você enviou: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
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
    const { data: existingSubmissions, error: checkError } = await supabase
      .from('submissions')
      .select('id')
      .eq('team_id', teamId)
      .eq('quest_id', questId)

    if (checkError) {
      console.error('Erro ao verificar submissão duplicada:', checkError)
      // Não bloquear se der erro - deixar prosseguir com validação do banco
    }

    if (existingSubmissions && existingSubmissions.length > 0) {
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
        file_url: deliverableType === 'url' ? content : fileUrl,  // URL vai para file_url
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

    console.log('Checking penalty application:');
    console.log('  validationResult?.penalty_calculated:', validationResult?.penalty_calculated);
    console.log('  is > 0:', validationResult?.penalty_calculated > 0);
    console.log('  will apply:', validationResult?.penalty_calculated && validationResult.penalty_calculated > 0);

    if (validationResult?.penalty_calculated && validationResult.penalty_calculated > 0) {
      console.log('Applying penalty of:', validationResult.penalty_calculated);

      const { error: penaltyError } = await supabase
        .from('penalties')
        .insert({
          team_id: teamId,
          penalty_type: 'atraso',
          points_deduction: validationResult.penalty_calculated,
          reason: `Submissão atrasada por ${validationResult.late_minutes_calculated} minutos na quest "${quest.name}"`,
          assigned_by_admin: true
        })

      if (penaltyError) {
        console.error('Erro ao inserir penalidade:', penaltyError);
      } else {
        console.log('Penalidade inserida com sucesso');
        penaltyApplied = true
        penaltyAmount = validationResult.penalty_calculated
      }
    } else {
      console.log('Nenhuma penalidade aplicada (penalty_calculated é 0 ou não foi atrasada)');
    }

    // ========================================
    // PASSO 9: Responder com sucesso
    // ========================================
    // ✅ REMOVIDO: revalidatePath() - polling detecta mudança automaticamente

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
    )  } catch (error) {
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
