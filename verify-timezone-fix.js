require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyFix() {
  console.log('🔍 VERIFICAÇÃO PÓS-CORREÇÃO\n');
  console.log('='.repeat(80));
  
  const { data: config } = await supabase
    .from('event_config')
    .select('event_start_time, phase_1_start_time, current_phase')
    .single();
  
  const { data: quest } = await supabase
    .from('quests')
    .select('started_at, planned_deadline_minutes')
    .eq('phase_id', 1)
    .eq('order_index', 1)
    .single();
  
  const { data: allQuests } = await supabase
    .from('quests')
    .select('planned_deadline_minutes, late_submission_window_minutes')
    .eq('phase_id', 1);
  
  const now = new Date();
  const eventStart = new Date(config.event_start_time);
  const phase1Start = new Date(config.phase_1_start_time);
  const questStart = new Date(quest.started_at);
  
  console.log('\n📅 TIMESTAMPS CORRIGIDOS (BRT):\n');
  console.log('Agora:               ', now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  console.log('event_start_time:    ', eventStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  console.log('phase_1_start_time:  ', phase1Start.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  console.log('Quest 1.1 started_at:', questStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ VERIFICAÇÕES:\n');
  
  // Verificação 1: Timestamps devem bater
  const diffPhaseQuest = Math.abs(phase1Start - questStart) / 1000;
  if (diffPhaseQuest < 1000) {
    console.log('1. ✅ phase_1_start_time e Quest 1.1 started_at estão sincronizados');
    console.log(`   Diferença: ${diffPhaseQuest.toFixed(0)} milissegundos`);
  } else {
    console.log('1. ❌ phase_1_start_time e Quest 1.1 started_at NÃO batem');
    console.log(`   Diferença: ${(diffPhaseQuest / 60).toFixed(0)} minutos`);
  }
  
  // Verificação 2: Calcular fim da fase
  const totalPhaseDuration = allQuests.reduce((sum, q) => {
    return sum + (q.planned_deadline_minutes || 0) + (q.late_submission_window_minutes || 0);
  }, 0);
  
  const phaseEnd = new Date(phase1Start.getTime() + totalPhaseDuration * 60 * 1000);
  const timeRemaining = (phaseEnd - now) / 1000 / 60;
  
  console.log('\n2. ⏰ CÁLCULO DE FIM DE FASE:');
  console.log(`   Duração total da Fase 1: ${totalPhaseDuration} minutos`);
  console.log(`   Fim previsto da Fase 1: ${phaseEnd.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  
  if (timeRemaining > 0) {
    const hours = Math.floor(timeRemaining / 60);
    const mins = Math.floor(timeRemaining % 60);
    console.log(`   Tempo restante: ${hours}h ${mins}min`);
    console.log(`   ✅ Fase vai avançar automaticamente no horário correto`);
  } else {
    console.log(`   ⚠️  Fase deveria ter terminado há ${Math.abs(Math.floor(timeRemaining / 60))}h ${Math.abs(Math.floor(timeRemaining % 60))}min`);
  }
  
  // Verificação 3: Tempo decorrido
  const elapsed = (now - eventStart) / 1000 / 60;
  console.log('\n3. 📊 TEMPO DECORRIDO:');
  console.log(`   Desde o início do evento: ${Math.floor(elapsed / 60)}h ${Math.floor(elapsed % 60)}min`);
  
  // Verificação 4: Próximos marcos
  console.log('\n4. 🎯 PRÓXIMOS MARCOS (BRT):');
  
  const quest1End = new Date(questStart.getTime() + quest.planned_deadline_minutes * 60 * 1000);
  const quest1Remaining = (quest1End - now) / 1000 / 60;
  
  if (quest1Remaining > 0) {
    console.log(`   Quest 1.1 termina: ${quest1End.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (em ${Math.floor(quest1Remaining)}min)`);
  } else {
    console.log(`   Quest 1.1: ⚠️  Deveria ter terminado há ${Math.abs(Math.floor(quest1Remaining))}min`);
  }
  
  console.log(`   Fase 1 termina: ${phaseEnd.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  
  console.log('\n' + '='.repeat(80));
  
  if (diffPhaseQuest < 1000 && timeRemaining > 0) {
    console.log('✅ TUDO OK! Sistema funcionando corretamente!\n');
  } else if (diffPhaseQuest < 1000) {
    console.log('⚠️  Timestamps corretos, mas verifique se as quests estão avançando\n');
  } else {
    console.log('❌ ATENÇÃO: Ainda há problemas de sincronização\n');
  }
}

verifyFix();
