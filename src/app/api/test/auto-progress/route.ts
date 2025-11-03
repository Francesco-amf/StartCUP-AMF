import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * API DE TESTE - PROGRESSÃO AUTOMÁTICA ACELERADA
 * ===============================================
 * GET /api/test/auto-progress?speed=fast
 * 
 * Simula o evento inteiro em velocidade acelerada:
 * - fast: quests duram 30 segundos cada (ao invés de minutos)
 * - turbo: quests duram 10 segundos cada
 * - real: usa os tempos reais (para testes longos)
 * 
 * O sistema:
 * 1. Inicia o evento
 * 2. Ativa Fase 1
 * 3. Percorre todas as quests (1→2→3→BOSS)
 * 4. Quando acaba a fase, avança para próxima
 * 5. Continua até o fim
 * 
 * ATENÇÃO: Deixe esta tab aberta! A progressão acontece automaticamente.
 */

interface ProgressState {
  currentPhase: number;
  currentQuest: number;
  totalPhases: number;
  status: string;
  lastAction: string;
  timeRemaining?: number;
}

// Estado global da progressão (simples, apenas para teste)
let progressState: ProgressState = {
  currentPhase: 1,
  currentQuest: 1,
  totalPhases: 5,
  status: 'idle',
  lastAction: 'Aguardando início',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'start';
  const speed = searchParams.get('speed') || 'fast';

  if (action === 'status') {
    return NextResponse.json(progressState);
  }

  if (action === 'stop') {
    progressState.status = 'stopped';
    return NextResponse.json({
      success: true,
      message: '⏸️ Progressão interrompida',
      state: progressState,
    });
  }

  if (action === 'start') {
    try {
  const supabase = createServiceRoleClient();

      // Resetar tudo primeiro
      await resetEvent(supabase);

      // Definir velocidade
  const speedMultiplier = speed === 'turbo' ? 10 : speed === 'fast' ? 30 : 1;

      progressState = {
        currentPhase: 1,
        currentQuest: 1,
        totalPhases: 5,
        status: 'running',
        lastAction: `Iniciando em modo ${speed} (${speedMultiplier}s por quest)`,
      };

      // Iniciar progressão assíncrona (não bloqueia a resposta)
      startAutoProgress(supabase, speedMultiplier);

      return NextResponse.json({
        success: true,
        message: `🚀 Progressão automática iniciada!`,
        speed: speed,
        speedMultiplier: `${speedMultiplier} segundos por quest`,
        instructions: [
          '✅ Abra /live-dashboard para ver as mudanças',
          '✅ Abra /submit para ver as quests mudando',
          '✅ Use GET /api/test/auto-progress?action=status para ver progresso',
          '✅ Use GET /api/test/auto-progress?action=stop para parar',
        ],
        state: progressState,
      });
    } catch (error) {
      console.error('Erro ao iniciar progressão:', error);
      return NextResponse.json(
        { error: 'Erro ao iniciar', details: error },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Ação inválida. Use: start, status ou stop' },
    { status: 400 }
  );
}

async function resetEvent(supabase: any) {
  // Resetar quests
  await supabase
    .from('quests')
    .update({
      status: 'scheduled',
      started_at: null,
      completed_at: null,
    })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  // Resetar fases
  await supabase
    .from('phases')
    .update({
      status: 'scheduled',
      started_at: null,
      completed_at: null,
    })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  // Resetar event_config
  await supabase.from('event_config').update({
    current_phase: 0,
    event_started: false,
    event_ended: false,
    event_start_time: null,
    event_end_time: null,
  });
}

async function startAutoProgress(supabase: any, speedMultiplier: number) {
  try {
    // 1. Iniciar evento
    progressState.lastAction = 'Iniciando evento...';
    await supabase.from('event_config').update({
      current_phase: 1,
      event_started: true,
      event_start_time: new Date().toISOString(),
    });

    await sleep(2000); // 2s para ver a mudança

    // 2. Buscar todas as fases
    const { data: phases } = await supabase
      .from('phases')
      .select('id, order_index, name')
      .order('order_index');

    if (!phases || phases.length === 0) {
      progressState.status = 'error';
      progressState.lastAction = 'Nenhuma fase encontrada';
      return;
    }

    // 3. Percorrer cada fase
    for (const phase of phases) {
      if (progressState.status === 'stopped') break;

      progressState.currentPhase = phase.order_index;
      progressState.lastAction = `Iniciando ${phase.name}`;

      // Ativar fase
      await supabase
        .from('phases')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', phase.id);

      // Atualizar current_phase_id
      await supabase.from('event_config').update({
        current_phase: phase.order_index,
      });

      await sleep(2000); // 2s para ver fase mudar

      // Buscar quests da fase
      const { data: quests } = await supabase
        .from('quests')
        .select('id, order_index, name, deliverable_type, duration_minutes')
        .eq('phase_id', phase.id)
        .order('order_index');

      if (!quests) continue;

      // 4. Percorrer cada quest da fase
      for (const quest of quests) {
        if (progressState.status === 'stopped') break;

        progressState.currentQuest = quest.order_index;
        const isBoss = quest.deliverable_type?.includes('presentation');
        progressState.lastAction = `Quest ${quest.order_index}/4: ${quest.name} ${isBoss ? '🔥' : ''}`;

        // Ativar quest
        const startedAt = new Date();
        await supabase
          .from('quests')
          .update({
            status: 'active',
            started_at: startedAt.toISOString(),
          })
          .eq('id', quest.id);

        // Aguardar duração da quest (acelerada)
        const durationSeconds = speedMultiplier;
        progressState.timeRemaining = durationSeconds;

        for (let i = durationSeconds; i > 0; i--) {
          if (progressState.status === 'stopped') break;
          progressState.timeRemaining = i;
          await sleep(1000);
        }

        // Completar quest
        await supabase
          .from('quests')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', quest.id);

        progressState.lastAction = `✅ Quest ${quest.order_index} completada`;
        await sleep(1000); // 1s entre quests
      }

      // Completar fase
      await supabase
        .from('phases')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', phase.id);

      progressState.lastAction = `✅ Fase ${phase.order_index} completada!`;
      await sleep(2000); // 2s entre fases
    }

    // Evento concluído
    await supabase.from('event_config').update({
      event_ended: true,
      event_end_time: new Date().toISOString(),
    });

    progressState.status = 'completed';
    progressState.lastAction = '🎉 Evento completo! Todas as fases e quests concluídas.';
  } catch (error) {
    console.error('Erro na progressão automática:', error);
    progressState.status = 'error';
    progressState.lastAction = `Erro: ${error}`;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
