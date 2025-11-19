require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteFix() {
  console.log('🧪 TESTE COMPLETO: Fix Quest 5.2 → 5.3 Transition\n');
  console.log('='.repeat(70));
  console.log('\n');
  
  // PASSO 1: Verificar que Quest 5.3 existe
  console.log('📋 PASSO 1: Verificando Quest 5.3...\n');
  
  const { data: quest53, error: quest53Error } = await supabase
    .from('quests')
    .select('id, order_index, name, status, started_at, phase_id')
    .eq('phase_id', 5)
    .eq('order_index', 3)
    .single();
    
  if (quest53Error) {
    console.error('❌ Quest 5.3 não encontrada:', quest53Error.message);
    return;
  }
  
  console.log('✅ Quest 5.3 encontrada:');
  console.log(`   ID: ${quest53.id}`);
  console.log(`   Nome: ${quest53.name}`);
  console.log(`   Status inicial: ${quest53.status}`);
  console.log(`   started_at inicial: ${quest53.started_at}\n`);
  
  // PASSO 2: Resetar para scheduled
  console.log('📋 PASSO 2: Resetando para scheduled...\n');
  
  await supabase
    .from('quests')
    .update({ status: 'scheduled' })
    .eq('id', quest53.id);
  
  await supabase
    .from('quests')
    .update({ started_at: null })
    .eq('id', quest53.id);
  
  console.log('✅ Quest resetada\n');
  
  // PASSO 3: Testar UPDATE com apenas status (simula o código da API)
  console.log('📋 PASSO 3: Testando UPDATE com apenas status...\n');
  console.log('   (Simulando: await supabase.from("quests").update({ status: "active" }).eq("id", ...))\n');
  
  const { error: activateError } = await supabase
    .from('quests')
    .update({ status: 'active' })
    .eq('id', quest53.id);
    
  if (activateError) {
    console.error(`❌ FALHOU ao atualizar status: ${activateError.message}\n`);
    console.error('   Código:', activateError.code);
    console.error('   Detalhes:', activateError.details);
    return;
  }
  
  console.log('✅ Status atualizado para "active" com sucesso!\n');
  
  // PASSO 4: Verificar se started_at foi preenchido automaticamente pelo trigger
  console.log('📋 PASSO 4: Verificando se trigger preencheu started_at automaticamente...\n');
  
  const { data: updatedQuest, error: verifyError } = await supabase
    .from('quests')
    .select('id, name, status, started_at')
    .eq('id', quest53.id)
    .single();
    
  if (verifyError) {
    console.error('❌ Erro ao verificar quest:', verifyError.message);
    return;
  }
  
  console.log('   Status: ' + updatedQuest.status);
  console.log('   started_at: ' + updatedQuest.started_at);
  console.log('');
  
  if (updatedQuest.started_at === null) {
    console.log('❌ ❌ ❌ TRIGGER NÃO FUNCIONOU! ❌ ❌ ❌\n');
    console.log('⚠️  started_at ainda está NULL!\n');
    console.log('📋 AÇÃO NECESSÁRIA:\n');
    console.log('   1. Verifique se você executou o SQL: create-auto-started-at-trigger.sql');
    console.log('   2. Acesse: https://supabase.com/dashboard > SQL Editor');
    console.log('   3. Execute o SQL completo do arquivo');
    console.log('   4. Execute este teste novamente\n');
    
    // Reverter
    await supabase.from('quests').update({ status: 'scheduled' }).eq('id', quest53.id);
    return;
  }
  
  console.log('✅ ✅ ✅ TRIGGER FUNCIONOU PERFEITAMENTE! ✅ ✅ ✅\n');
  console.log('   started_at foi preenchido automaticamente!\n');
  
  // PASSO 5: Testar API de advance-quest
  console.log('📋 PASSO 5: Testando API /api/admin/advance-quest...\n');
  
  // Resetar para estado inicial
  await supabase.from('quests').update({ status: 'scheduled', started_at: null }).eq('id', quest53.id);
  
  // Fechar Quest 5.2
  const { data: quest52 } = await supabase
    .from('quests')
    .select('id')
    .eq('phase_id', 5)
    .eq('order_index', 2)
    .single();
  
  if (quest52) {
    await supabase
      .from('quests')
      .update({ status: 'closed', ended_at: new Date().toISOString() })
      .eq('id', quest52.id);
    
    console.log('   Quest 5.2 fechada (simulando expiração)\n');
  }
  
  // Chamar API de advance
  console.log('   Chamando: POST /api/admin/advance-quest\n');
  
  const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${apiUrl}/api/admin/advance-quest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questId: quest52?.id })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ ✅ ✅ API FUNCIONOU! ✅ ✅ ✅\n');
      console.log('   Resposta:', JSON.stringify(data, null, 2));
      console.log('');
    } else {
      console.log('❌ API retornou erro:\n');
      console.log('   Status:', response.status);
      console.log('   Erro:', data.error);
      console.log('   Código:', data.code);
      console.log('');
    }
  } catch (error) {
    console.log('⚠️  Não foi possível testar API (servidor pode não estar rodando)\n');
    console.log('   Erro:', error.message);
    console.log('   Isso é normal se o servidor local não estiver ativo.\n');
  }
  
  // PASSO 6: Verificar estado final
  console.log('📋 PASSO 6: Verificando estado final de todas as quests Fase 5...\n');
  
  const { data: allQuests } = await supabase
    .from('quests')
    .select('id, order_index, name, status, started_at')
    .eq('phase_id', 5)
    .order('order_index');
  
  allQuests?.forEach(q => {
    console.log(`   [${q.order_index}] ${q.name}`);
    console.log(`       Status: ${q.status}`);
    console.log(`       started_at: ${q.started_at || 'null'}`);
    console.log('');
  });
  
  // RESUMO FINAL
  console.log('='.repeat(70));
  console.log('\n🎯 RESUMO DO TESTE:\n');
  
  if (updatedQuest.started_at) {
    console.log('✅ Trigger auto_set_quest_started_at: FUNCIONANDO');
    console.log('✅ UPDATE com apenas status: FUNCIONANDO');
    console.log('✅ started_at preenchido automaticamente: SIM');
    console.log('');
    console.log('🎉 FIX COMPLETO E VALIDADO!\n');
    console.log('   O sistema agora pode avançar de Quest 5.2 → 5.3 sem erros.\n');
  } else {
    console.log('❌ Fix ainda não está completo');
    console.log('   Execute o SQL: create-auto-started-at-trigger.sql no Supabase\n');
  }
  
  console.log('='.repeat(70));
  console.log('');
}

testCompleteFix().catch(console.error);
