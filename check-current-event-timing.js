require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEventTiming() {
  console.log('🕐 VERIFICAÇÃO DE HORÁRIOS DO EVENTO\n');
  console.log('='.repeat(80));
  
  // Buscar configuração do evento
  const { data: config } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();
  
  const now = new Date();
  
  console.log(`\n📅 AGORA (UTC): ${now.toISOString()}`);
  console.log(`📅 AGORA (BRT): ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log(`⏰ Timezone: BRT (UTC-3)`);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 STATUS DO EVENTO:\n');
  
  console.log(`Evento iniciado: ${config.event_started ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`Evento encerrado: ${config.event_ended ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`Fase atual: ${config.current_phase}`);
  
  if (config.event_start_time) {
    const startTime = new Date(config.event_start_time);
    console.log(`\n🚀 Início do evento (UTC): ${startTime.toISOString()}`);
    console.log(`🚀 Início do evento (BRT): ${startTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    const elapsedMs = now - startTime;
    const elapsedMin = Math.floor(elapsedMs / 60000);
    const hours = Math.floor(elapsedMin / 60);
    const mins = elapsedMin % 60;
    console.log(`⏱️  Tempo decorrido: ${hours}h ${mins}min`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 HORÁRIOS DAS FASES:\n');
  
  const phases = [
    { num: 1, duration: 150, field: 'phase_1_start_time' },
    { num: 2, duration: 210, field: 'phase_2_start_time' },
    { num: 3, duration: 150, field: 'phase_3_start_time' },
    { num: 4, duration: 120, field: 'phase_4_start_time' },
    { num: 5, duration: 90, field: 'phase_5_start_time' }
  ];
  
  let expectedEnd = null;
  
  for (const phase of phases) {
    if (config[phase.field]) {
      const phaseStart = new Date(config[phase.field]);
      const phaseEnd = new Date(phaseStart.getTime() + phase.duration * 60000);
      
      console.log(`Fase ${phase.num}:`);
      console.log(`  Início (BRT): ${phaseStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log(`  Duração: ${phase.duration} minutos (${Math.floor(phase.duration/60)}h ${phase.duration%60}min)`);
      console.log(`  Fim previsto (BRT): ${phaseEnd.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      
      if (phase.num === config.current_phase) {
        const remaining = phaseEnd - now;
        const remainingMin = Math.floor(remaining / 60000);
        if (remainingMin > 0) {
          console.log(`  ⏰ Tempo restante: ${Math.floor(remainingMin/60)}h ${remainingMin%60}min`);
        } else {
          console.log(`  ⚠️  Fase deveria ter terminado há ${Math.abs(Math.floor(remainingMin/60))}h ${Math.abs(remainingMin%60)}min`);
        }
      }
      
      expectedEnd = phaseEnd;
      console.log();
    }
  }
  
  if (expectedEnd) {
    console.log('='.repeat(80));
    console.log(`🏁 FIM PREVISTO DO EVENTO (BRT): ${expectedEnd.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    const totalRemaining = expectedEnd - now;
    const totalRemainingMin = Math.floor(totalRemaining / 60000);
    if (totalRemainingMin > 0) {
      console.log(`⏰ Faltam: ${Math.floor(totalRemainingMin/60)}h ${totalRemainingMin%60}min`);
    } else {
      console.log(`✅ Evento deveria ter terminado há ${Math.abs(Math.floor(totalRemainingMin/60))}h ${Math.abs(totalRemainingMin%60)}min`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 QUESTS DA FASE ATUAL:\n');
  
  const { data: quests } = await supabase
    .from('quests')
    .select('*')
    .eq('phase_id', config.current_phase)
    .order('order_index');
  
  if (quests && quests.length > 0) {
    for (const quest of quests) {
      console.log(`${quest.name}:`);
      console.log(`  Status: ${quest.status}`);
      if (quest.started_at) {
        const questStart = new Date(quest.started_at);
        const deadline = new Date(questStart.getTime() + quest.planned_deadline_minutes * 60000);
        
        console.log(`  Início (BRT): ${questStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        console.log(`  Deadline (BRT): ${deadline.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        
        if (quest.status === 'active') {
          const remaining = deadline - now;
          const remainingMin = Math.floor(remaining / 60000);
          if (remainingMin > 0) {
            console.log(`  ⏰ Tempo restante: ${Math.floor(remainingMin/60)}h ${remainingMin%60}min`);
          } else {
            console.log(`  ⚠️  Deveria ter fechado há ${Math.abs(Math.floor(remainingMin/60))}h ${Math.abs(remainingMin%60)}min`);
          }
        }
        
        if (quest.closed_at) {
          const closedAt = new Date(quest.closed_at);
          console.log(`  Fechado em (BRT): ${closedAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        }
      }
      console.log();
    }
  }
  
  console.log('='.repeat(80));
  console.log('✅ Verificação concluída!\n');
}

checkEventTiming();
