require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseAutoStartIssue() {
  console.log('🔍 DIAGNOSTICANDO POR QUE BOSS ATIVOU NO MEIO DA QUEST 1.1\n');
  console.log('='.repeat(80));
  
  // 1. Ver timestamp de quando quests foram ativadas
  console.log('\n1️⃣  TIMELINE DE ATIVAÇÃO DAS QUESTS:\n');
  
  const { data: quests } = await supabase
    .from('quests')
    .select('id, phase_id, order_index, name, status, started_at, ended_at')
    .order('phase_id')
    .order('order_index');
  
  if (quests) {
    const grouped = {};
    quests.forEach(q => {
      const key = `Fase ${q.phase_id}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(q);
    });
    
    Object.entries(grouped).forEach(([phase, phaseQuests]) => {
      console.log(`${phase}:`);
      phaseQuests.forEach(q => {
        const started = q.started_at ? new Date(q.started_at).toLocaleString('pt-BR') : 'não iniciada';
        const ended = q.ended_at ? new Date(q.ended_at).toLocaleString('pt-BR') : '-';
        console.log(`   ${q.order_index}. ${q.name.substring(0, 30)}`);
        console.log(`      Status: ${q.status} | Iniciou: ${started} | Terminou: ${ended}`);
      });
    });
  }
  
  // 2. Ver Event Config
  console.log('\n2️⃣  EVENT CONFIG:\n');
  
  const { data: config } = await supabase
    .from('event_config')
    .select('*')
    .single();
  
  if (config) {
    console.log(`Current Phase: ${config.current_phase}`);
    console.log(`Event Started: ${config.event_started}`);
    console.log(`Event Start Time: ${config.event_start_time}`);
    console.log(`Phase 1 Start: ${config.phase_1_start_time}`);
  }
  
  // 3. Analisar o que deveria ter acontecido
  console.log('\n' + '='.repeat(80));
  console.log('📊 ANÁLISE:\n');
  
  const quest11 = quests?.find(q => q.phase_id === 1 && q.order_index === 1);
  const quest12 = quests?.find(q => q.phase_id === 1 && q.order_index === 2);
  const quest13 = quests?.find(q => q.phase_id === 1 && q.order_index === 3);
  const boss1 = quests?.find(q => q.phase_id === 1 && q.order_index === 4);
  
  if (quest11 && boss1) {
    console.log('Timeline esperada:');
    console.log(`   1. Quest 1.1 inicia`);
    console.log(`   2. Quest 1.1 expira (50 min depois)`);
    console.log(`   3. CRON chama auto_start_next_quest()`);
    console.log(`   4. Função verifica: Quest 1.1 expirou?`);
    console.log(`   5. SIM! Ativa Quest 1.2`);
    console.log(`   6. Mais tarde... Quest 1.2 expira`);
    console.log(`   7. Ativa Quest 1.3`);
    console.log(`   8. Quest 1.3 expira`);
    console.log(`   9. ❌ DEVERIA PULAR BOSS! Mas ao invés disso...`);
    console.log(`   10. BOSS foi ativado! 🔴`);
    
    console.log('\n❌ PROBLEMA:\n');
    
    if (quest11.started_at && boss1.started_at) {
      const diff = new Date(boss1.started_at) - new Date(quest11.started_at);
      const minutes = diff / (1000 * 60);
      console.log(`Boss ativado ${minutes.toFixed(1)} minutos após Quest 1.1 iniciar`);
      console.log(`Quest 1.1 deveria durar: 50 minutos`);
      
      if (minutes < 50) {
        console.log(`\n🔴 BOSS ATIVOU CEDO! (No meio da Quest 1.1)`);
        console.log(`\nPossível causa:`);
        console.log(`- Função auto_start_next_quest() tem BUG na validação de BOSS`);
        console.log(`- Deliverable_type check não está funcionando`);
        console.log(`- Quest 1.1 foi marcada como "expirada" prematuramente`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

diagnoseAutoStartIssue().catch(console.error);
