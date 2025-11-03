'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { questId, plannedDeadlineMinutes, allowLateSubmissions } = await request.json()

    const supabase = await createServerSupabaseClient()

    // Validar autenticação e permissão admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = user.user_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem configurar deadlines.' },
        { status: 403 }
      )
    }

    // Validar entrada
    if (!questId || plannedDeadlineMinutes === undefined) {
      return NextResponse.json(
        { error: 'questId e plannedDeadlineMinutes são obrigatórios' },
        { status: 400 }
      )
    }

    // Atualizar quest com deadline
    const { data: quest, error: updateError } = await supabase
      .from('quests')
      .update({
        planned_deadline_minutes: plannedDeadlineMinutes,
        late_submission_window_minutes: 15, // Sempre 15 minutos de janela
        allow_late_submissions: allowLateSubmissions !== false // Padrão: true
      })
      .eq('id', questId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar deadline:', updateError)
      return NextResponse.json(
        { error: 'Erro ao configurar deadline' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Deadline configurado com sucesso: ${plannedDeadlineMinutes} minutos`,
      quest
    })

  } catch (error) {
    console.error('Erro fatal ao configurar deadline:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const questId = searchParams.get('questId')

    const supabase = await createServerSupabaseClient()

    // Validar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar informações de deadline da quest
    const { data: quest, error } = await supabase
      .from('quests')
      .select('id, name, planned_deadline_minutes, late_submission_window_minutes, allow_late_submissions, started_at')
      .eq('id', questId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Quest não encontrada' },
        { status: 404 }
      )
    }

    // Calcular informações úteis
    let deadlineInfo = {
      questId: quest.id,
      questName: quest.name,
      plannedDeadlineMinutes: quest.planned_deadline_minutes,
      lateSubmissionWindowMinutes: quest.late_submission_window_minutes,
      allowLateSubmissions: quest.allow_late_submissions,
      startedAt: quest.started_at,
      deadlineAt: null as Date | null,
      lateWindowEndsAt: null as Date | null
    }

    if (quest.started_at) {
      const startedAt = new Date(quest.started_at)
      deadlineInfo.deadlineAt = new Date(startedAt.getTime() + (quest.planned_deadline_minutes * 60 * 1000))
      deadlineInfo.lateWindowEndsAt = new Date(deadlineInfo.deadlineAt.getTime() + (quest.late_submission_window_minutes * 60 * 1000))
    }

    return NextResponse.json({
      success: true,
      deadline: deadlineInfo
    })

  } catch (error) {
    console.error('Erro ao buscar deadline:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
