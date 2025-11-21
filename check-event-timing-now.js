require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEventTiming() {
  console.log('🕐 VERIFICANDO TIMING DO EVENTO...\n');
  console.log('='.repeat(80));
  
  // 1. Buscar configuração do evento
  const { data: eventConfig } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();
  
  if (!eventConfig) {
    console.log('❌ Configuração do evento não encontrada!');
    return;
  }
  
  // 2. Definir durações das fases (em minutos)
  const phaseDurations = {
    1: 150, // 2h30
    2: 210, // 3h30
    3: 150, // 2h30
    4: 120, // 2h00
    5: 90   // 1h30
  };
  
  const now = new Date();
  const eventStartTime = new Date(eventConfig.event_start_time);
  
  console.log('\n📅 INFORMAÇÕES DO EVENTO:');
  console.log('='.repeat(80));
  console.log(`Iniciado: ${eventStartTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
  console.log(`Hora atual: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
  console.log(`Evento started: ${eventConfig.event_started ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`Evento ended: ${eventConfig.event_ended ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`Fase atual: ${eventConfig.current_phase}`);
  
  // 3. Calcular tempo decorrido
  const elapsedMs = now - eventStartTime;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedMins = elapsedMinutes % 60;
  
  console.log(`\n⏱️  Tempo decorrido desde o início: ${elapsedHours}h ${elapsedMins}min (${elapsedMinutes} minutos)`);
  
  // 4. Calcular em que fase deveria estar
  let accumulatedMinutes = 0;
  let expectedPhase = 0;
  
  for (let phase = 1; phase <= 5; phase++) {
    accumulatedMinutes += phaseDurations[phase];
    if (elapsedMinutes < accumulatedMinutes) {
      expectedPhase = phase;
      break;
    }
  }
  
  if (expectedPhase === 0) expectedPhase = 5; // Se passou de tudo, está na fase 5
  
  console.log(`\n📊 ANÁLISE DE FASES:`);
  console.log('='.repeat(80));
  
  let totalTime = 0;
  for (let phase = 1; phase <= 5; phase++) {
    const phaseStart = totalTime;
    const phaseEnd = totalTime + phaseDurations[phase];
    totalTime = phaseEnd;
    
    const phaseStartTime = new Date(eventStartTime.getTime() + phaseStart * 60000);
    const phaseEndTime = new Date(eventStartTime.getTime() + phaseEnd * 60000);
    
    const status = phase < eventConfig.current_phase ? '✅ CONCLUÍDA' :
                   phase === eventConfig.current_phase ? '🔄 ATUAL' :
                   '⏳ FUTURA';
    
    console.log(`\nFase ${phase}: ${status}`);
    console.log(`  Duração: ${phaseDurations[phase]} minutos (${Math.floor(phaseDurations[phase]/60)}h${phaseDurations[phase]%60}min)`);
    console.log(`  Início previsto: ${phaseStartTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
    console.log(`  Fim previsto: ${phaseEndTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
    
    // Mostrar tempo real se a fase já começou
    const phaseStartField = `phase_${phase}_start_time`;
    if (eventConfig[phaseStartField]) {
      const realStart = new Date(eventConfig[phaseStartField]);
      console.log(`  Início real: ${realStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
      
      const diffMs = realStart - phaseStartTime;
      const diffMin = Math.floor(diffMs / 60000);
      if (Math.abs(diffMin) > 1) {
        const direction = diffMin > 0 ? 'atrasou' : 'adiantou';
        console.log(`  ⚠️  ${direction} ${Math.abs(diffMin)} minutos`);
      }
    }
    
    if (phase === eventConfig.current_phase) {
      const phaseElapsed = elapsedMinutes - phaseStart;
      const phaseRemaining = phaseDurations[phase] - phaseElapsed;
      console.log(`  ⏱️  Tempo decorrido nesta fase: ${phaseElapsed} minutos`);
      console.log(`  ⏰ Tempo restante: ${phaseRemaining} minutos (${Math.floor(phaseRemaining/60)}h${phaseRemaining%60}min)`);
      
      const expectedEndTime = new Date(eventStartTime.getTime() + phaseEnd * 60000);
      console.log(`  🎯 Término esperado: ${expectedEndTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
    }
  }
  
  // 5. Verificar se está na fase correta
  console.log('\n');
  console.log('='.repeat(80));
  console.log('🎯 VERIFICAÇÃO:');
  console.log('='.repeat(80));
  
  if (eventConfig.current_phase === expectedPhase) {
    console.log(`✅ CORRETO! Está na fase esperada (Fase ${eventConfig.current_phase})`);
  } else {
    console.log(`⚠️  ATENÇÃO! Deveria estar na Fase ${expectedPhase}, mas está na Fase ${eventConfig.current_phase}`);
    const phaseDiff = eventConfig.current_phase - expectedPhase;
    if (phaseDiff > 0) {
      console.log(`   Sistema está ${phaseDiff} fase(s) ADIANTADO`);
    } else {
      console.log(`   Sistema está ${Math.abs(phaseDiff)} fase(s) ATRASADO`);
    }
  }
  
  // 6. Calcular fim previsto do evento
  const totalDuration = Object.values(phaseDurations).reduce((a, b) => a + b, 0);
  const eventEndTime = new Date(eventStartTime.getTime() + totalDuration * 60000);
  
  console.log('\n📅 FIM DO EVENTO:');
  console.log('='.repeat(80));
  console.log(`Duração total: ${totalDuration} minutos (${Math.floor(totalDuration/60)}h${totalDuration%60}min)`);
  console.log(`Término previsto: ${eventEndTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
  
  const remainingTotal = totalDuration - elapsedMinutes;
  if (remainingTotal > 0) {
    console.log(`Tempo restante: ${remainingTotal} minutos (${Math.floor(remainingTotal/60)}h${remainingTotal%60}min)`);
  } else {
    console.log(`⚠️  O evento já deveria ter terminado há ${Math.abs(remainingTotal)} minutos!`);
  }
  
  // 7. Verificar quests ativas
  console.log('\n🎯 QUESTS ATIVAS:');
  console.log('='.repeat(80));
  
  const { data: activeQuests } = await supabase
    .from('quests')
    .select('name, phase_id, status, started_at, planned_deadline_minutes')
    .eq('status', 'active')
    .order('phase_id')
    .order('order_index');
  
  if (activeQuests && activeQuests.length > 0) {
    activeQuests.forEach(quest => {
      console.log(`\n📌 ${quest.name} (Fase ${quest.phase_id})`);
      if (quest.started_at) {
        const startTime = new Date(quest.started_at);
        const endTime = new Date(startTime.getTime() + quest.planned_deadline_minutes * 60000);
        console.log(`   Iniciada: ${startTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        console.log(`   Deadline: ${endTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        
        const questRemaining = Math.floor((endTime - now) / 60000);
        if (questRemaining > 0) {
          console.log(`   ⏰ Tempo restante: ${questRemaining} minutos`);
        } else {
          console.log(`   ⚠️  Passou do deadline há ${Math.abs(questRemaining)} minutos!`);
        }
      }
    });
  } else {
    console.log('Nenhuma quest ativa no momento.');
  }
  
  console.log('\n' + '='.repeat(80));
}

checkEventTiming();
