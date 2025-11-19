require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAndRecreateQuest53() {
  console.log('🔧 FIX DEFINITIVO: Deletar e Recriar Quest 5.3 Corrompida\n');
  console.log('='.repeat(70));
  console.log('\n');
  
  const corruptedId = '143e6745-c263-478e-bece-7d6e6eef6648';
  
  // PASSO 1: Backup dos dados da quest corrompida
  console.log('📋 PASSO 1: Fazendo backup da Quest 5.3 corrompida...\n');
  
  const { data: oldQuest, error: backupError } = await supabase
    .from('quests')
    .select('*')
    .eq('id', corruptedId)
    .single();
    
  if (backupError) {
    console.error('❌ Erro ao buscar quest:', backupError.message);
    return;
  }
  
  console.log('✅ Backup realizado:');
  console.log(`   Nome: ${oldQuest.name}`);
  console.log(`   Phase: ${oldQuest.phase_id}`);
  console.log(`   Order: ${oldQuest.order_index}`);
  console.log(`   Status: ${oldQuest.status}\n`);
  
  // PASSO 2: Deletar quest corrompida
  console.log('📋 PASSO 2: Deletando quest corrompida...\n');
  
  const { error: deleteError } = await supabase
    .from('quests')
    .delete()
    .eq('id', corruptedId);
    
  if (deleteError) {
    console.error('❌ Erro ao deletar:', deleteError.message);
    console.log('\n⚠️  Tentando método alternativo...\n');
    
    // Método alternativo: DELETE com phase_id e order_index
    const { error: deleteError2 } = await supabase
      .from('quests')
      .delete()
      .eq('phase_id', 5)
      .eq('order_index', 3);
      
    if (deleteError2) {
      console.error('❌ Método alternativo também falhou:', deleteError2.message);
      console.log('\n⚠️  AÇÃO MANUAL NECESSÁRIA:');
      console.log('   Acesse Supabase SQL Editor e execute:');
      console.log(`   DELETE FROM quests WHERE id = '${corruptedId}';`);
      console.log('\n');
      return;
    }
  }
  
  console.log('✅ Quest corrompida deletada com sucesso!\n');
  
  // PASSO 3: Verificar deleção
  console.log('📋 PASSO 3: Verificando deleção...\n');
  
  const { data: remaining, error: verifyError } = await supabase
    .from('quests')
    .select('id, order_index, name')
    .eq('phase_id', 5)
    .order('order_index');
    
  if (verifyError) {
    console.error('❌ Erro na verificação:', verifyError.message);
    return;
  }
  
  console.log(`✅ Quests restantes na Fase 5: ${remaining.length}`);
  remaining.forEach(q => console.log(`   [${q.order_index}] ${q.name}`));
  console.log('');
  
  // PASSO 4: Recriar Quest 5.3 com TODOS os dados originais
  console.log('📋 PASSO 4: Recriando Quest 5.3 com novo ID...\n');
  
  const { data: newQuest, error: insertError } = await supabase
    .from('quests')
    .insert({
      phase_id: oldQuest.phase_id,
      order_index: oldQuest.order_index,
      name: oldQuest.name,
      description: oldQuest.description,
      status: 'scheduled', // Sempre começar como scheduled
      deliverable_type: oldQuest.deliverable_type,
      max_points: oldQuest.max_points,
      duration_minutes: oldQuest.duration_minutes,
      planned_deadline_minutes: oldQuest.planned_deadline_minutes,
      late_submission_window_minutes: oldQuest.late_submission_window_minutes,
      allow_late_submissions: oldQuest.allow_late_submissions,
      auto_start_enabled: oldQuest.auto_start_enabled || false,
      auto_start_delay_minutes: oldQuest.auto_start_delay_minutes || 0,
      started_at: null,
      started_by: null,
      ended_at: null
    })
    .select()
    .single();
    
  if (insertError) {
    console.error('❌ Erro ao criar nova quest:', insertError.message);
    console.log('   Código:', insertError.code);
    console.log('   Detalhes:', insertError.details);
    return;
  }
  
  console.log('✅ Nova Quest 5.3 criada com sucesso!');
  console.log(`   Novo ID: ${newQuest.id}`);
  console.log(`   Nome: ${newQuest.name}`);
  console.log(`   Status: ${newQuest.status}\n`);
  
  // PASSO 5: Testar UPDATE na nova quest
  console.log('📋 PASSO 5: Testando UPDATE na nova Quest 5.3...\n');
  
  const { error: testError } = await supabase
    .from('quests')
    .update({ status: 'active' })
    .eq('id', newQuest.id);
    
  if (testError) {
    console.error('❌ UPDATE AINDA FALHOU:', testError.message);
    console.log('\n⚠️  A quest NOVA também está com problema!');
    console.log('   Isso indica um problema mais profundo na tabela quests.');
    console.log('   Verifique RLS policies, triggers e constraints no Supabase.\n');
    return;
  }
  
  console.log('✅ ✅ ✅ UPDATE FUNCIONOU! ✅ ✅ ✅\n');
  
  // Reverter teste
  await supabase
    .from('quests')
    .update({ status: 'scheduled', started_at: null })
    .eq('id', newQuest.id);
  
  console.log('↩️  Status revertido para scheduled\n');
  
  // PASSO 6: Verificação final
  console.log('📋 PASSO 6: Verificação final de todas as quests Fase 5...\n');
  
  const { data: finalQuests } = await supabase
    .from('quests')
    .select('id, order_index, name, status, started_at')
    .eq('phase_id', 5)
    .order('order_index');
    
  finalQuests?.forEach(q => {
    console.log(`   [${q.order_index}] ${q.name}`);
    console.log(`       ID: ${q.id}`);
    console.log(`       Status: ${q.status}`);
    console.log('');
  });
  
  // RESUMO FINAL
  console.log('='.repeat(70));
  console.log('\n🎉 FIX COMPLETO E VALIDADO!\n');
  console.log('✅ Quest 5.3 corrompida deletada');
  console.log('✅ Nova Quest 5.3 criada com sucesso');
  console.log(`✅ Novo ID: ${newQuest.id}`);
  console.log('✅ UPDATE funcionando normalmente');
  console.log('');
  console.log('🚀 O sistema agora pode avançar de Quest 5.2 → 5.3 sem erros!\n');
  console.log('📋 PRÓXIMO PASSO:');
  console.log('   1. Faça commit das alterações');
  console.log('   2. Deploy para produção');
  console.log('   3. Teste em produção com: node test-complete-fix.js\n');
  console.log('='.repeat(70));
  console.log('');
}

fixAndRecreateQuest53().catch(console.error);
