require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixQuest53() {
  console.log('🔧 Iniciando correção da Quest 5.3 corrompida...\n');
  
  const corruptedQuestId = 'eefb5798-a8b5-4d07-9c8d-8fee933dbcd6';
  
  // PASSO 1: Verificar Quest 5.3 atual
  console.log('📋 PASSO 1: Verificando Quest 5.3 corrompida...');
  const { data: oldQuest, error: oldError } = await supabase
    .from('quests')
    .select('*')
    .eq('id', corruptedQuestId)
    .single();
    
  if (oldError) {
    console.error('❌ Erro ao buscar quest antiga:', oldError);
  } else if (oldQuest) {
    console.log(`✅ Quest corrompida encontrada: ${oldQuest.name}`);
    console.log(`   ID: ${oldQuest.id}`);
    console.log(`   Status: ${oldQuest.status}`);
  } else {
    console.log('⚠️ Quest corrompida já foi deletada');
  }
  console.log('');
  
  // PASSO 2: Deletar Quest 5.3 corrompida
  console.log('🗑️ PASSO 2: Deletando Quest 5.3 corrompida...');
  const { error: deleteError } = await supabase
    .from('quests')
    .delete()
    .eq('id', corruptedQuestId);
    
  if (deleteError) {
    console.error('❌ Erro ao deletar quest:', deleteError);
    return;
  }
  console.log('✅ Quest corrompida deletada com sucesso\n');
  
  // PASSO 3: Verificar deleção
  console.log('🔍 PASSO 3: Verificando deleção...');
  const { data: questsAfterDelete, error: verifyError } = await supabase
    .from('quests')
    .select('id, order_index, name')
    .eq('phase_id', 5)
    .order('order_index');
    
  if (verifyError) {
    console.error('❌ Erro ao verificar:', verifyError);
    return;
  }
  console.log(`✅ Quests restantes na Fase 5: ${questsAfterDelete.length}`);
  questsAfterDelete.forEach(q => console.log(`   [${q.order_index}] ${q.name}`));
  console.log('');
  
  // PASSO 4: Recriar Quest 5.3 com dados corretos
  console.log('🔨 PASSO 4: Recriando Quest 5.3...');
  const { data: newQuest, error: insertError } = await supabase
    .from('quests')
    .insert({
      phase_id: 5,
      order_index: 3,
      name: 'Quest 5.3 - Vídeo Pitch (30s)',
      description: 'Vídeo de pitch de 30 segundos apresentando a solução de forma impactante e memorável',
      status: 'scheduled',
      deliverable_type: '["file","url"]',
      max_points: 100,
      duration_minutes: 30,
      planned_deadline_minutes: 30,
      late_submission_window_minutes: 15,
      allow_late_submissions: true,
      auto_start_enabled: false,
      auto_start_delay_minutes: 0,
      started_at: null,
      started_by: null,
      ended_at: null
    })
    .select()
    .single();
    
  if (insertError) {
    console.error('❌ Erro ao criar nova quest:', insertError);
    return;
  }
  console.log('✅ Nova Quest 5.3 criada com sucesso!');
  console.log(`   Novo ID: ${newQuest.id}`);
  console.log(`   Nome: ${newQuest.name}`);
  console.log(`   Status: ${newQuest.status}\n`);
  
  // PASSO 5: Verificar todas as quests da Fase 5
  console.log('📋 PASSO 5: Verificação final - Todas as Quests Fase 5:');
  const { data: allQuests, error: finalError } = await supabase
    .from('quests')
    .select('id, order_index, name, status, started_at')
    .eq('phase_id', 5)
    .order('order_index');
    
  if (finalError) {
    console.error('❌ Erro na verificação final:', finalError);
    return;
  }
  
  allQuests.forEach(q => {
    console.log(`  [${q.order_index}] ${q.name}`);
    console.log(`      ID: ${q.id}`);
    console.log(`      Status: ${q.status}`);
    console.log('');
  });
  
  // PASSO 6: Testar UPDATE na nova Quest 5.3
  console.log('🧪 PASSO 6: Testando UPDATE na nova Quest 5.3...');
  const { error: testUpdateError } = await supabase
    .from('quests')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', newQuest.id);
    
  if (testUpdateError) {
    console.error('❌ ERRO no UPDATE (ainda corrompida!):', testUpdateError);
    return;
  }
  console.log('✅ UPDATE funcionou perfeitamente!\n');
  
  // Reverter o teste
  await supabase
    .from('quests')
    .update({ status: 'scheduled', started_at: null })
    .eq('id', newQuest.id);
  console.log('✅ Status revertido para scheduled\n');
  
  console.log('🎉 FIX COMPLETO! Quest 5.3 recriada e funcionando!\n');
}

fixQuest53().catch(console.error);
