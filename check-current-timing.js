require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEventTiming() {
  console.log('🕐 VERIFICAÇÃO DE TIMING DO EVENTO\n');
  console.log('='.repeat(80));
  
  // 1. Buscar configuração do evento
  const { data: eventConfig } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();
  
  if (!eventConfig) {
    console.log('❌ Evento não encontrado!');
    return;
  }
  
  const now = new Date();
  const nowBRT = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
  
  console.log(`\n📅 AGORA: ${nowBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT\n`);
  
  // 2. Status do evento
  console.log('📊 STATUS DO EVENTO:');
  console.log(`  Event Started: ${eventConfig.event_started ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`  Event Ended: ${eventConfig.event_ended ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`  Current Phase: ${eventConfig.current_phase}`);
  
  if (!eventConfig.event_started) {
    console.log('\n⚠️  Evento ainda não foi iniciado!');
    return;
  }
  
  // 3. Horários de início
  const eventStartTime = new Date(eventConfig.event_start_time);
  const eventStartBRT = new Date(eventStartTime.getTime() - (3 * 60 * 60 * 1000));
  
  console.log(`\n🚀 INÍCIO DO EVENTO:`);
  console.log(`  ${eventStartBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
  
  // 4. Duração total esperada
  const phaseDurations = {
    1: 150, // 2h30
    2: 210, // 3h30
    3: 150, // 2h30
    4: 120, // 2h
    5: 90   // 1h30
  };
  
  const totalDuration = Object.values(phaseDurations).reduce((a, b) => a + b, 0);
  const expectedEndTime = new Date(eventStartTime.getTime() + (totalDuration * 60 * 1000));
  const expectedEndBRT = new Date(expectedEndTime.getTime() - (3 * 60 * 60 * 1000));
  
  console.log(`\n⏱️  DURAÇÃO TOTAL ESPERADA: ${totalDuration} minutos (${(totalDuration / 60).toFixed(1)}h)`);
  console.log(`📍 TÉRMINO ESPERADO: ${expectedEndBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
  
  // 5. Tempo decorrido
  const elapsedMs = now - eventStartTime;
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedMins = elapsedMinutes % 60;
  
  console.log(`\n⏳ TEMPO DECORRIDO: ${elapsedHours}h ${elapsedMins}min (${elapsedMinutes} minutos)`);
  
  // 6. Análise por fase
  console.log('\n' + '='.repeat(80));
  console.log('📋 ANÁLISE POR FASE:\n');
  
  let accumulatedTime = 0;
  
  for (let phase = 1; phase <= 5; phase++) {
    const phaseStartField = `phase_${phase}_start_time`;
    const phaseStartTime = eventConfig[phaseStartField];
    const duration = phaseDurations[phase];
    
    console.log(`FASE ${phase}:`);
    console.log(`  Duração esperada: ${duration} min (${(duration / 60).toFixed(1)}h)`);
    
    if (phaseStartTime) {
      const phaseStart = new Date(phaseStartTime);
      const phaseStartBRT = new Date(phaseStart.getTime() - (3 * 60 * 60 * 1000));
      const expectedPhaseStart = new Date(eventStartTime.getTime() + (accumulatedTime * 60 * 1000));
      const expectedPhaseStartBRT = new Date(expectedPhaseStart.getTime() - (3 * 60 * 60 * 1000));
      
      console.log(`  ✅ Início real: ${phaseStartBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
      console.log(`  📌 Início esperado: ${expectedPhaseStartBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
      
      const delayMs = phaseStart - expectedPhaseStart;
      const delayMinutes = Math.floor(delayMs / (1000 * 60));
      
      if (Math.abs(delayMinutes) > 2) {
        if (delayMinutes > 0) {
          console.log(`  ⚠️  ATRASO: ${delayMinutes} minutos`);
        } else {
          console.log(`  ⚡ ADIANTADO: ${Math.abs(delayMinutes)} minutos`);
        }
      } else {
        console.log(`  ✅ NO HORÁRIO (diferença: ${delayMinutes} min)`);
      }
      
      // Verificar se ainda está na fase atual
      if (phase === eventConfig.current_phase) {
        const expectedEnd = new Date(phaseStart.getTime() + (duration * 60 * 1000));
        const expectedEndBRT = new Date(expectedEnd.getTime() - (3 * 60 * 60 * 1000));
        const remaining = expectedEnd - now;
        const remainingMinutes = Math.floor(remaining / (1000 * 60));
        
        console.log(`  🎯 FASE ATUAL`);
        console.log(`  📍 Término esperado: ${expectedEndBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
        
        if (remainingMinutes > 0) {
          console.log(`  ⏱️  Tempo restante: ${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}min`);
        } else {
          console.log(`  ⚠️  PASSOU DO PRAZO há ${Math.abs(Math.floor(remainingMinutes / 60))}h ${Math.abs(remainingMinutes % 60)}min`);
        }
      } else if (phase < eventConfig.current_phase) {
        console.log(`  ✅ CONCLUÍDA`);
      }
      
    } else if (phase < eventConfig.current_phase) {
      console.log(`  ⚠️  Não tem registro de início (mas já passou)`);
    } else {
      const expectedPhaseStart = new Date(eventStartTime.getTime() + (accumulatedTime * 60 * 1000));
      const expectedPhaseStartBRT = new Date(expectedPhaseStart.getTime() - (3 * 60 * 60 * 1000));
      console.log(`  ⏳ Início esperado: ${expectedPhaseStartBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
    }
    
    console.log('');
    accumulatedTime += duration;
  }
  
  // 7. Verificar quests da fase atual
  console.log('='.repeat(80));
  console.log('🎯 QUESTS DA FASE ATUAL:\n');
  
  const { data: currentQuests } = await supabase
    .from('quests')
    .select('*')
    .eq('phase_id', eventConfig.current_phase)
    .order('order_index');
  
  for (const quest of currentQuests || []) {
    console.log(`${quest.name}:`);
    console.log(`  Status: ${quest.status}`);
    
    if (quest.started_at) {
      const questStart = new Date(quest.started_at);
      const questStartBRT = new Date(questStart.getTime() - (3 * 60 * 60 * 1000));
      console.log(`  Início: ${questStartBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
      
      if (quest.planned_deadline_minutes) {
        const expectedEnd = new Date(questStart.getTime() + (quest.planned_deadline_minutes * 60 * 1000));
        const expectedEndBRT = new Date(expectedEnd.getTime() - (3 * 60 * 60 * 1000));
        console.log(`  Deadline: ${expectedEndBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
        
        const remaining = expectedEnd - now;
        const remainingMinutes = Math.floor(remaining / (1000 * 60));
        
        if (quest.status === 'active') {
          if (remainingMinutes > 0) {
            console.log(`  ⏱️  Tempo restante: ${remainingMinutes} min`);
          } else {
            console.log(`  ⚠️  PASSOU DO PRAZO há ${Math.abs(remainingMinutes)} min`);
          }
        }
      }
      
      if (quest.closed_at) {
        const questEnd = new Date(quest.closed_at);
        const questEndBRT = new Date(questEnd.getTime() - (3 * 60 * 60 * 1000));
        console.log(`  Fechamento: ${questEndBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
      }
    }
    console.log('');
  }
  
  // 8. Resumo final
  console.log('='.repeat(80));
  console.log('📊 RESUMO:\n');
  
  const remainingTotal = expectedEndTime - now;
  const remainingTotalMinutes = Math.floor(remainingTotal / (1000 * 60));
  
  if (remainingTotalMinutes > 0) {
    console.log(`✅ Evento dentro do cronograma`);
    console.log(`⏱️  Tempo até o fim esperado: ${Math.floor(remainingTotalMinutes / 60)}h ${remainingTotalMinutes % 60}min`);
  } else {
    console.log(`⚠️  Evento passou do horário esperado`);
    console.log(`⏱️  Tempo além do esperado: ${Math.abs(Math.floor(remainingTotalMinutes / 60))}h ${Math.abs(remainingTotalMinutes % 60)}min`);
  }
  
  console.log('\n' + '='.repeat(80));
}

checkEventTiming();
