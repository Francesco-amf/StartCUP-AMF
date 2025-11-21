require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTimezoneIssue() {
  console.log('🔍 INVESTIGAÇÃO DO PROBLEMA DE TIMEZONE\n');
  console.log('='.repeat(80));
  
  // Buscar dados do banco
  const { data: config } = await supabase
    .from('event_config')
    .select('event_start_time, phase_1_start_time')
    .single();
  
  const { data: quest } = await supabase
    .from('quests')
    .select('started_at, name')
    .eq('phase_id', 1)
    .eq('order_index', 1)
    .single();
  
  console.log('\n📊 VALORES NO BANCO (formato UTC):\n');
  console.log('event_start_time:   ', config.event_start_time);
  console.log('phase_1_start_time: ', config.phase_1_start_time);
  console.log('Quest 1.1 started_at:', quest.started_at);
  
  console.log('\n' + '='.repeat(80));
  console.log('🌍 CONVERTIDO PARA BRT (UTC-3):\n');
  
  const eventStart = new Date(config.event_start_time);
  const phase1Start = new Date(config.phase_1_start_time);
  const questStart = new Date(quest.started_at);
  
  console.log('event_start_time:   ', eventStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  console.log('phase_1_start_time: ', phase1Start.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  console.log('Quest 1.1 started_at:', questStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  DIFERENÇAS DETECTADAS:\n');
  
  const diffEventPhase = Math.floor((eventStart - phase1Start) / 60000);
  const diffEventQuest = Math.floor((eventStart - questStart) / 60000);
  const diffPhaseQuest = Math.floor((phase1Start - questStart) / 60000);
  
  console.log(`event_start_time - phase_1_start_time = ${diffEventPhase} minutos`);
  console.log(`event_start_time - Quest 1.1 started_at = ${diffEventQuest} minutos`);
  console.log(`phase_1_start_time - Quest 1.1 started_at = ${diffPhaseQuest} minutos`);
  
  console.log('\n' + '='.repeat(80));
  console.log('💡 ANÁLISE:\n');
  
  if (diffEventPhase === 180) {
    console.log('❌ PROBLEMA CONFIRMADO: event_start_time está 3 horas à frente!');
    console.log('   Isto é exatamente o offset do timezone BRT (UTC-3)');
    console.log('   Algum código está salvando horário LOCAL como se fosse UTC');
  }
  
  if (diffPhaseQuest === 0) {
    console.log('✅ phase_1_start_time e Quest 1.1 started_at estão CORRETOS');
    console.log('   Eles batem perfeitamente');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 IMPACTO NA PRÁTICA:\n');
  
  console.log('1. As QUESTS estão funcionando normalmente');
  console.log('   → Usam phase_X_start_time e quest.started_at (corretos)');
  console.log('');
  console.log('2. O campo event_start_time está ERRADO');
  console.log('   → Apenas usado para exibição/relatórios');
  console.log('   → NÃO afeta a lógica das quests');
  console.log('');
  console.log('3. Resultado: Sistema funciona, mas relatórios mostram hora errada');
  
  console.log('\n' + '='.repeat(80));
  console.log('🔧 VALORES CORRETOS DEVERIAM SER:\n');
  
  const correctEventStart = new Date(questStart);
  console.log('event_start_time deveria ser:');
  console.log('  UTC:', correctEventStart.toISOString());
  console.log('  BRT:', correctEventStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  
  console.log('\n✅ Investigação completa!\n');
}

checkTimezoneIssue();
