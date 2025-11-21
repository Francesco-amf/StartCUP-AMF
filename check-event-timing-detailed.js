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
  
  const now = new Date();
  const nowBRT = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // UTC-3 (BRT)
  
  console.log(`\n📅 AGORA: ${nowBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);
  
  // 2. Status do evento
  console.log('📊 STATUS DO EVENTO:');
  console.log(`  Event Started: ${eventConfig.event_started ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`  Event Ended: ${eventConfig.event_ended ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`  Fase Atual: ${eventConfig.current_phase}`);
  
  if (!eventConfig.event_started) {
    console.log('\n⚠️  EVENTO NÃO INICIADO AINDA!\n');
    return;
  }
  
  // 3. Horários de início
  const eventStartTime = new Date(eventConfig.event_start_time);
  const eventStartBRT = new Date(eventStartTime.getTime() - (3 * 60 * 60 * 1000));
  
  console.log(`\n⏰ INÍCIO DO EVENTO: ${eventStartBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  
  // 4. Calcular tempo decorrido
  const elapsedMs = now - eventStartTime;
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedMins = elapsedMinutes % 60;
  
  console.log(`⏱️  TEMPO DECORRIDO: ${elapsedHours}h ${elapsedMins}min (${elapsedMinutes} minutos totais)\n`);
  
  // 5. Durações das fases
  const phaseDurations = {
    1: 150, // 2h30min
    2: 210, // 3h30min
    3: 150, // 2h30min
    4: 120, // 2h00min
    5: 90   // 1h30min
  };
  
  console.log('='.repeat(80));
  console.log('📋 TIMELINE ESPERADA DAS FASES:\n');
  
  let cumulativeTime = 0;
  const phases = [];
  
  for (let phase = 1; phase <= 5; phase++) {
    const duration = phaseDurations[phase];
    const phaseStart = new Date(eventStartTime.getTime() + (cumulativeTime * 60 * 1000));
    const phaseEnd = new Date(eventStartTime.getTime() + ((cumulativeTime + duration) * 60 * 1000));
    
    const phaseStartBRT = new Date(phaseStart.getTime() - (3 * 60 * 60 * 1000));
    const phaseEndBRT = new Date(phaseEnd.getTime() - (3 * 60 * 60 * 1000));
    
    phases.push({
      phase,
      duration,
      startTime: phaseStart,
      endTime: phaseEnd,
      startBRT: phaseStartBRT,
      endBRT: phaseEndBRT,
      cumulativeStart: cumulativeTime,
      cumulativeEnd: cumulativeTime + duration
    });
    
    const status = elapsedMinutes >= cumulativeTime && elapsedMinutes < (cumulativeTime + duration) 
      ? '🔴 EM ANDAMENTO' 
      : elapsedMinutes >= (cumulativeTime + duration)
      ? '✅ CONCLUÍDA'
      : '⏳ AGUARDANDO';
    
    console.log(`Fase ${phase} (${duration}min = ${Math.floor(duration/60)}h${duration%60}min):`);
    console.log(`  Início esperado: ${phaseStartBRT.toLocaleTimeString('pt-BR')} BRT`);
    console.log(`  Fim esperado: ${phaseEndBRT.toLocaleTimeString('pt-BR')} BRT`);
    console.log(`  Status: ${status}\n`);
    
    cumulativeTime += duration;
  }
  
  // 6. Fim esperado do evento
  const totalDuration = Object.values(phaseDurations).reduce((a, b) => a + b, 0);
  const eventEndTime = new Date(eventStartTime.getTime() + (totalDuration * 60 * 1000));
  const eventEndBRT = new Date(eventEndTime.getTime() - (3 * 60 * 60 * 1000));
  
  console.log('='.repeat(80));
  console.log(`\n🏁 FIM ESPERADO DO EVENTO: ${eventEndBRT.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log(`   (${totalDuration} minutos = ${Math.floor(totalDuration/60)}h${totalDuration%60}min após o início)\n`);
  
  // 7. Verificar quests ativas
  console.log('='.repeat(80));
  console.log('\n🎯 QUESTS ATIVAS NO MOMENTO:\n');
  
  const { data: activeQuests } = await supabase
    .from('quests')
    .select('id, name, phase_id, status, started_at, planned_deadline_minutes')
    .eq('status', 'active')
    .order('phase_id');
  
  if (activeQuests && activeQuests.length > 0) {
    for (const quest of activeQuests) {
      const questStart = new Date(quest.started_at);
      const questStartBRT = new Date(questStart.getTime() - (3 * 60 * 60 * 1000));
      const questEnd = new Date(questStart.getTime() + (quest.planned_deadline_minutes * 60 * 1000));
      const questEndBRT = new Date(questEnd.getTime() - (3 * 60 * 60 * 1000));
      
      const timeLeft = questEnd - now;
      const minutesLeft = Math.floor(timeLeft / (1000 * 60));
      
      console.log(`${quest.name} (Fase ${quest.phase_id}):`);
      console.log(`  Iniciada: ${questStartBRT.toLocaleTimeString('pt-BR')} BRT`);
      console.log(`  Deadline: ${questEndBRT.toLocaleTimeString('pt-BR')} BRT`);
      console.log(`  Tempo restante: ${minutesLeft > 0 ? minutesLeft + ' minutos' : 'EXPIRADA'}\n`);
    }
  } else {
    console.log('  Nenhuma quest ativa no momento.\n');
  }
  
  // 8. Análise: estamos no tempo certo?
  console.log('='.repeat(80));
  console.log('\n📊 ANÁLISE:\n');
  
  const currentPhase = eventConfig.current_phase;
  const expectedPhase = phases.find(p => 
    elapsedMinutes >= p.cumulativeStart && elapsedMinutes < p.cumulativeEnd
  );
  
  if (expectedPhase) {
    if (currentPhase === expectedPhase.phase) {
      console.log(`✅ DENTRO DO TEMPO ESPERADO!`);
      console.log(`   Fase atual (${currentPhase}) corresponde ao tempo decorrido.`);
      
      const timeInPhase = elapsedMinutes - expectedPhase.cumulativeStart;
      const timeLeftInPhase = expectedPhase.duration - timeInPhase;
      
      console.log(`\n   Tempo na Fase ${currentPhase}: ${timeInPhase} minutos`);
      console.log(`   Tempo restante na Fase ${currentPhase}: ${timeLeftInPhase} minutos (${Math.floor(timeLeftInPhase/60)}h${timeLeftInPhase%60}min)`);
      
      const nextPhaseTime = new Date(eventStartTime.getTime() + (expectedPhase.cumulativeEnd * 60 * 1000));
      const nextPhaseTimeBRT = new Date(nextPhaseTime.getTime() - (3 * 60 * 60 * 1000));
      
      if (currentPhase < 5) {
        console.log(`\n   Próxima fase (${currentPhase + 1}) deve começar: ${nextPhaseTimeBRT.toLocaleTimeString('pt-BR')} BRT`);
      } else {
        console.log(`\n   Esta é a última fase! Evento termina: ${nextPhaseTimeBRT.toLocaleTimeString('pt-BR')} BRT`);
      }
    } else {
      console.log(`⚠️  POSSÍVEL ATRASO/ADIANTAMENTO!`);
      console.log(`   Fase atual no sistema: ${currentPhase}`);
      console.log(`   Fase esperada pelo tempo: ${expectedPhase.phase}`);
      
      if (currentPhase < expectedPhase.phase) {
        console.log(`\n   Sistema está ATRASADO (ainda na fase ${currentPhase}, deveria estar na ${expectedPhase.phase})`);
      } else {
        console.log(`\n   Sistema está ADIANTADO (já na fase ${currentPhase}, deveria estar na ${expectedPhase.phase})`);
      }
    }
  } else if (elapsedMinutes >= totalDuration) {
    console.log(`✅ EVENTO DEVERIA TER TERMINADO!`);
    console.log(`   Todas as fases já deveriam estar concluídas.`);
    console.log(`   Tempo além do esperado: ${elapsedMinutes - totalDuration} minutos`);
  }
  
  console.log('\n' + '='.repeat(80));
}

checkEventTiming();
