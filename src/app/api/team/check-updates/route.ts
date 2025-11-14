import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * ✅ Endpoint para verificar se os dados da equipe mudaram
 *
 * Usado por TeamPageRealtime component para saber se deve fazer refresh
 *
 * Retorna um hash dos dados atuais - se for diferente do anterior,
 * significa que houve mudança (quest avançada, submissão, etc)
 */

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar informações da equipe
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('email', user.email)
      .single()

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Buscar configuração do evento
    const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'
    const { data: eventConfig } = await supabase
      .from('event_config')
      .select('*')
      .eq('id', eventConfigId)
      .single()

    // Buscar submissions da equipe
    const { data: submissions } = await supabase
      .from('submissions')
      .select('quest_id, status, final_points, created_at')
      .eq('team_id', team.id)
      .order('created_at', { ascending: false })

    // Buscar quests (apenas os dados relevantes para mudança)
    const { data: quests } = await supabase
      .from('quests')
      .select('id, status, started_at, order_index, phase_id')
      .order('phase_id, order_index')

    // Criar um snapshot dos dados que importam para atualização
    const relevantData = {
      currentPhase: eventConfig?.current_phase,
      eventStarted: eventConfig?.event_started,
      eventEnded: eventConfig?.event_ended,
      // Hash das submissions (para detectar novas submissões)
      submissionsCount: submissions?.length || 0,
      lastSubmissionTime: submissions?.[0]?.created_at,
      // Hash das quests (para detectar mudanças de status/timing)
      questsSnapshot: quests?.map(q => `${q.id}:${q.status}:${q.started_at}`).join('|'),
      // Timestamp para detectar qualquer mudança
      timestamp: Date.now()
    }

    // Criar hash dos dados
    const dataString = JSON.stringify({
      currentPhase: relevantData.currentPhase,
      eventStarted: relevantData.eventStarted,
      eventEnded: relevantData.eventEnded,
      submissionsCount: relevantData.submissionsCount,
      lastSubmissionTime: relevantData.lastSubmissionTime,
      questsSnapshot: relevantData.questsSnapshot
    })

    const hash = crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex')

    return NextResponse.json({
      snapshot: hash,
      data: relevantData
    })
  } catch (error) {
    console.error('[check-updates] Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
