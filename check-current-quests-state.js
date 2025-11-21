require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCurrentState() {
  console.log('🔍 ESTADO REAL DAS QUESTS (VALORES RAW DO BANCO)\n');
  console.log('='.repeat(80));
  
  const { data: quests } = await supabase
    .from('quests')
    .select('*')
    .in('phase_id', [1, 2])
    .order('phase_id', { ascending: true })
    .order('order_index', { ascending: true });
  
  const now = new Date();
  console.log(`\n⏰ AGORA (sistema):`);
  console.log(`  UTC: ${now.toISOString()}`);
  console.log(`  BRT: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);
  
  for (const quest of quests) {
    console.log(`\n📝 ${quest.name} (Fase ${quest.phase_id}.${quest.order_index})`);
    console.log('─'.repeat(80));
    console.log(`Status: ${quest.status}`);
    console.log(`\nTimestamps (RAW do banco):`);
    console.log(`  started_at:  ${quest.started_at || 'NULL'}`);
    console.log(`  ended_at:    ${quest.ended_at || 'NULL'}`);
    
    if (quest.started_at) {
      console.log(`\nInterpretação BRT:`);
      const start = new Date(quest.started_at);
      console.log(`  started_at: ${start.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      
      if (quest.status === 'active') {
        const deadline = new Date(start.getTime() + quest.planned_deadline_minutes * 60 * 1000);
        const remaining = Math.round((deadline - now) / (1000 * 60));
        console.log(`  Deadline: ${deadline.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        console.log(`  Tempo restante: ${remaining} min`);
      }
    }
    
    if (quest.ended_at) {
      const end = new Date(quest.ended_at);
      console.log(`\n  ended_at (BRT): ${end.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      
      if (quest.started_at) {
        const start = new Date(quest.started_at);
        const duration = Math.round((end - start) / (1000 * 60));
        console.log(`  Duração real: ${duration} min`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

checkCurrentState();
