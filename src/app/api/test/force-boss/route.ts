import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * API DE TESTE - FORÇAR BOSS ATIVO
 * ================================
 * GET /api/test/force-boss?phase=1
 * 
 * Uso: Para testar rapidamente sem esperar os tempos reais
 * - Ativa a fase especificada
 * - Completa as 3 quests regulares
 * - Ativa o BOSS
 * 
 * ATENÇÃO: APENAS PARA DESENVOLVIMENTO!
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phaseNumber = parseInt(searchParams.get('phase') || '1');

    if (phaseNumber < 1 || phaseNumber > 5) {
      return NextResponse.json(
        { error: 'Fase deve ser entre 1 e 5' },
        { status: 400 }
      );
    }

  const supabase = createServiceRoleClient();

    // 1. Buscar a fase
    const { data: phase, error: phaseError } = await supabase
      .from('phases')
      .select('id')
      .eq('order_index', phaseNumber)
      .single();

    if (phaseError || !phase) {
      return NextResponse.json(
        { error: 'Fase não encontrada', details: phaseError },
        { status: 404 }
      );
    }

    // 2. Ativar a fase
    {
      const { error } = await supabase
        .from('phases')
        .update({
          status: 'in_progress',
          started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hora atrás
        })
        .eq('id', phase.id);
      if (error) return NextResponse.json({ error: 'Falha ao ativar fase', details: error }, { status: 500 })
    }

    // 3. Atualizar event_config
    // Atualiza event_config (usa schema real: current_phase INTEGER, event_started BOOLEAN)
    {
      const { error } = await supabase
        .from('event_config')
        .update({
          current_phase: phaseNumber,
          event_started: true,
          event_start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        }); // tabela é singleton
      if (error) return NextResponse.json({ error: 'Falha ao atualizar event_config', details: error }, { status: 500 })
    }

    // 4. Buscar todas as quests da fase
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('id, order_index, duration_minutes')
      .eq('phase_id', phase.id)
      .order('order_index');

    if (questsError || !quests) {
      return NextResponse.json(
        { error: 'Quests não encontradas', details: questsError },
        { status: 404 }
      );
    }

    // 5. Completar quests 1, 2, 3
    for (const quest of quests) {
      if (quest.order_index <= 3) {
        // Completar quest (marcar como se tivesse terminado há 5 min)
        const durationMs = (quest.duration_minutes || 30) * 60 * 1000;
        const startedAt = new Date(Date.now() - durationMs - 5 * 60 * 1000);
        const completedAt = new Date(Date.now() - 5 * 60 * 1000);

        {
          const { error } = await supabase
            .from('quests')
            .update({
              status: 'completed',
              started_at: startedAt.toISOString(),
              completed_at: completedAt.toISOString(),
            })
            .eq('id', quest.id);
          if (error) return NextResponse.json({ error: 'Falha ao completar quest', details: error }, { status: 500 })
        }
      } else if (quest.order_index === 4) {
        // Ativar BOSS (começou agora)
        const { error } = await supabase
          .from('quests')
          .update({
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .eq('id', quest.id);
        if (error) return NextResponse.json({ error: 'Falha ao ativar BOSS', details: error }, { status: 500 })
      }
    }

    // 6. Verificar estado final
    const { data: finalState } = await supabase
      .from('quests')
      .select('order_index, name, status, deliverable_type')
      .eq('phase_id', phase.id)
      .order('order_index');

    return NextResponse.json({
      success: true,
      message: `✅ BOSS da Fase ${phaseNumber} ativado com sucesso!`,
      phase: phaseNumber,
      quests: finalState,
      instructions: {
        next_steps: [
          'Abra /live-dashboard para ver o BOSS com visual vermelho',
          'Abra /submit para ver o BossQuestCard',
          'Timer do BOSS deve mostrar 10 minutos',
        ],
      },
    });
  } catch (error) {
    console.error('Erro ao forçar BOSS:', error);
    return NextResponse.json(
      { error: 'Erro interno', details: error },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test/force-boss/reset
 * Resetar tudo para começar de novo
 */
export async function POST() {
  try {
  const supabase = createServiceRoleClient();

    // Resetar todas as quests
    {
      const { error } = await supabase
        .from('quests')
        .update({
          status: 'scheduled',
          started_at: null,
          completed_at: null,
        })
      if (error) return NextResponse.json({ error: 'Falha ao resetar quests', details: error }, { status: 500 })
    }

    // Resetar todas as fases
    {
      const { error } = await supabase
        .from('phases')
        .update({
          status: 'scheduled',
          started_at: null,
          completed_at: null,
        })
      if (error) return NextResponse.json({ error: 'Falha ao resetar fases', details: error }, { status: 500 })
    }

    // Resetar event_config
    {
      const { error } = await supabase.from('event_config').update({
        current_phase: 0,
        event_started: false,
        event_ended: false,
        event_start_time: null,
        event_end_time: null,
      })
      if (error) return NextResponse.json({ error: 'Falha ao resetar event_config', details: error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '🔄 Sistema resetado! Todas as quests e fases voltaram ao estado inicial.',
    });
  } catch (error) {
    console.error('Erro ao resetar:', error);
    return NextResponse.json(
      { error: 'Erro ao resetar', details: error },
      { status: 500 }
    );
  }
}
