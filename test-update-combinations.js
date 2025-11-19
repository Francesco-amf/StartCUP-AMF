require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpdates() {
  console.log('🧪 Testando diferentes combinações de UPDATE...\n');
  
  const { data: quest, error: selectError } = await supabase
    .from('quests')
    .select('id, order_index, name, status, started_at, started_by')
    .eq('phase_id', 5)
    .eq('order_index', 3)
    .single();
    
  if (selectError) {
    console.error('❌ Erro ao buscar quest:', selectError);
    return;
  }
  
  console.log(`Quest: ${quest.name}`);
  console.log(`ID: ${quest.id}`);
  console.log(`Status: ${quest.status}`);
  console.log(`started_at: ${quest.started_at}`);
  console.log(`started_by: ${quest.started_by}\n`);
  
  // Teste 1: só status
  console.log('Teste 1: Apenas status');
  let { error } = await supabase
    .from('quests')
    .update({ status: 'active' })
    .eq('id', quest.id);
  console.log(error ? `❌ ${error.message}` : '✅ OK');
  
  // Reverter
  await supabase.from('quests').update({ status: 'scheduled' }).eq('id', quest.id);
  
  // Teste 2: status + started_at (sem started_by)
  console.log('\nTeste 2: status + started_at');
  ({ error } = await supabase
    .from('quests')
    .update({ 
      status: 'active',
      started_at: new Date().toISOString()
    })
    .eq('id', quest.id));
  console.log(error ? `❌ ${error.message}` : '✅ OK');
  
  // Reverter
  await supabase.from('quests').update({ status: 'scheduled', started_at: null }).eq('id', quest.id);
  
  // Teste 3: status + started_by (sem started_at)  console.log('\nTeste 3: status + started_by');
  ({ error } = await supabase
    .from('quests')
    .update({ 
      status: 'active',
      started_by: null
    })
    .eq('id', quest.id));
  console.log(error ? `❌ ${error.message}` : '✅ OK');
  
  // Reverter
  await supabase.from('quests').update({ status: 'scheduled', started_by: null }).eq('id', quest.id);
  
  // Teste 4: todos os 3 campos
  console.log('\nTeste 4: status + started_at + started_by');
  ({ error } = await supabase
    .from('quests')
    .update({ 
      status: 'active',
      started_at: new Date().toISOString(),
      started_by: null
    })
    .eq('id', quest.id));
  console.log(error ? `❌ ${error.message}` : '✅ OK');
  
  // Reverter
  await supabase.from('quests').update({ status: 'scheduled', started_at: null }).eq('id', quest.id);
  
  // Teste 5: apenas started_at
  console.log('\nTeste 5: Apenas started_at');
  ({ error } = await supabase
    .from('quests')
    .update({ 
      started_at: new Date().toISOString()
    })
    .eq('id', quest.id));
  console.log(error ? `❌ ${error.message}` : '✅ OK');
  
  // Reverter
  await supabase.from('quests').update({ started_at: null }).eq('id', quest.id);
  
  // Teste 6: tentando com string timestamp diferente
  console.log('\nTeste 6: started_at com timestamp UTC explícito');
  const utcTime = new Date().toISOString().replace('T', ' ').replace('Z', '+00');
  ({ error } = await supabase
    .from('quests')
    .update({ 
      status: 'active',
      started_at: utcTime
    })
    .eq('id', quest.id));
  console.log(error ? `❌ ${error.message}` : '✅ OK');
  
  // Reverter
  await supabase.from('quests').update({ status: 'scheduled', started_at: null }).eq('id', quest.id);
  
  console.log('\n📊 Testes concluídos!\n');
}

testUpdates().catch(console.error);
