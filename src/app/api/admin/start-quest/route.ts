'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUTCTimestamp } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { questId } = await request.json()

    if (!questId) {
      return NextResponse.json(
        { error: 'questId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Validar autenticação e permissão de admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem iniciar quests.' },
        { status: 403 }
      )
    }

    // Usar service_role para bypassar RLS
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

    // Buscar a quest
    const { data: quest, error: questError } = await supabaseAdmin
      .from('quests')
      .select('id, name, phase_id, order_index')
      .eq('id', questId)
      .single()

    if (questError || !quest) {
      return NextResponse.json(
        { error: 'Quest não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar quest para status 'active'
    // IMPORTANTE: Usar getUTCTimestamp() para garantir UTC correto
    // Evita problema de timezone onde servidor local é interpretado como UTC
    const { data: updatedQuest, error: updateError } = await supabaseAdmin
      .from('quests')
      .update({
        status: 'active',
        started_at: getUTCTimestamp()
      })
      .eq('id', questId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar quest:', updateError)
      return NextResponse.json(
        { error: 'Erro ao iniciar quest' },
        { status: 500 }
      )
    }

    console.log(`✅ Quest iniciada: ${quest.name} (ID: ${questId})`)

    return NextResponse.json({
      success: true,
      message: `Quest "${quest.name}" iniciada com sucesso!`,
      quest: updatedQuest
    })

  } catch (error) {
    console.error('Erro ao iniciar quest:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phaseId = searchParams.get('phaseId')

    if (!phaseId) {
      return NextResponse.json(
        { error: 'phaseId é obrigatório' },
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

    // Buscar todas as quests desta fase
    const { data: quests, error } = await supabase
      .from('quests')
      .select('id, name, order_index, status, started_at')
      .eq('phase_id', phaseId)
      .order('order_index', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar quests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      quests
    })

  } catch (error) {
    console.error('Erro ao buscar quests:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
