require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixQuest11() {
  console.log('🔧 Corrigindo Quest 1.1...\n');
  
  // Buscar Quest 1.1
  const { data: quest } = await supabase
    .from('quests')
    .select('*')
    .eq('phase_id', 1)
    .eq('order_index', 1)
    .single();
  
  console.log('Status atual:');
  console.log(`  started_at: ${quest.started_at}`);
  console.log(`  completed_at: ${quest.completed_at || 'NULL'}`);
  console.log(`  status: ${quest.status}`);
  console.log(`  planned_deadline: ${quest.planned_deadline_minutes} min`);
  
  if (quest.status === 'closed' && !quest.completed_at) {
    console.log('\n❌ PROBLEMA CONFIRMADO: completed_at está NULL\n');
    
    // Calcular quando deveria ter fechado
    const startTime = new Date(quest.started_at);
    const plannedEnd = new Date(startTime.getTime() + quest.planned_deadline_minutes * 60 * 1000);
    
    console.log('Correção proposta:');
    console.log(`  completed_at: ${plannedEnd.toISOString()}`);
    console.log(`  BRT: ${plannedEnd.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // Atualizar
    const { error } = await supabase
      .from('quests')
      .update({ completed_at: plannedEnd.toISOString() })
      .eq('id', quest.id);
    
    if (error) {
      console.error('\n❌ Erro ao atualizar:', error);
    } else {
      console.log('\n✅ Quest 1.1 corrigida com sucesso!');
      
      // Verificar
      const { data: updated } = await supabase
        .from('quests')
        .select('completed_at')
        .eq('id', quest.id)
        .single();
      
      console.log(`\nNovo completed_at: ${updated.completed_at}`);
    }
  } else {
    console.log('\n✅ Quest 1.1 está OK (não precisa correção)');
  }
}

fixQuest11();
