require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdvanceQuestFix() {
  console.log('🧪 Testando fix de advance-quest com UPDATE em duas etapas...\n');
  
  // Buscar Quest 5.3
  const { data: quest53, error: quest53Error } = await supabase
    .from('quests')
    .select('id, order_index, name, status, started_at, phase_id')
    .eq('phase_id', 5)
    .eq('order_index', 3)
    .single();
    
  if (quest53Error) {
    console.error('❌ Erro ao buscar Quest 5.3:', quest53Error);
    return;
  }
  
  console.log(`Quest 5.3 encontrada:`);
  console.log(`  ID: ${quest53.id}`);
  console.log(`  Nome: ${quest53.name}`);
  console.log(`  Status: ${quest53.status}`);
  console.log(`  started_at: ${quest53.started_at}\n`);
  
  // Simular o processo de advance-quest com o fix de 2 etapas
  console.log('📝 Simulando advance-quest com UPDATE em duas etapas...\n');
  
  // Etapa 1: UPDATE status
  console.log('Etapa 1: Atualizando status para "active"...');
  const { error: statusError, count: statusCount } = await supabase
    .from('quests')
    .update({ status: 'active' })
    .eq('id', quest53.id);
    
  if (statusError) {
    console.error(`❌ Erro na Etapa 1: ${statusError.message}`);
    return;
  }
  console.log(`✅ Status atualizado! (count: ${statusCount})\n`);
  
  // Etapa 2: UPDATE started_at
  console.log('Etapa 2: Atualizando started_at...');
  const now = new Date().toISOString();
  const { error: startedAtError, count: startedAtCount } = await supabase
    .from('quests')
    .update({ started_at: now })
    .eq('id', quest53.id);
    
  if (startedAtError) {
    console.error(`❌ Erro na Etapa 2: ${startedAtError.message}`);
    
    // Reverter status
    await supabase.from('quests').update({ status: 'scheduled' }).eq('id', quest53.id);
    return;
  }
  console.log(`✅ started_at atualizado! (count: ${startedAtCount})\n`);
  
  // Verificar resultado final
  console.log('🔍 Verificando resultado final...');
  const { data: updatedQuest, error: verifyError } = await supabase
    .from('quests')
    .select('id, name, status, started_at')
    .eq('id', quest53.id)
    .single();
    
  if (verifyError) {
    console.error('❌ Erro ao verificar:', verifyError);
    return;
  }
  
  console.log('✅ Quest 5.3 após UPDATE:');
  console.log(`  Status: ${updatedQuest.status}`);
  console.log(`  started_at: ${updatedQuest.started_at}\n`);
  
  if (updatedQuest.status === 'active' && updatedQuest.started_at) {
    console.log('🎉 FIX FUNCIONOU PERFEITAMENTE!\n');
    
    // Reverter para teste
    console.log('↩️ Revertendo para scheduled...');
    await supabase
      .from('quests')
      .update({ status: 'scheduled' })
      .eq('id', quest53.id);
    await supabase
      .from('quests')
      .update({ started_at: null })
      .eq('id', quest53.id);
    console.log('✅ Revertido para scheduled\n');
  } else {
    console.log('❌ Algo ainda está errado...\n');
  }
  
  console.log('✅ Teste concluído!\n');
}

testAdvanceQuestFix().catch(console.error);
