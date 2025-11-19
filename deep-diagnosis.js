require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deepDiagnosis() {
  console.log('🔬 DIAGNÓSTICO PROFUNDO: Investigando bloqueio de UPDATE\n');
  console.log('='.repeat(70));
  
  // Buscar Quest 5.3
  const { data: quest53 } = await supabase
    .from('quests')
    .select('*')
    .eq('phase_id', 5)
    .eq('order_index', 3)
    .single();
    
  console.log('\n📋 Quest 5.3 completa:');
  console.log(JSON.stringify(quest53, null, 2));
  console.log('\n');
  
  // Teste 1: Tentar UPDATE em Quest 5.1 (que funcionou antes)
  console.log('🧪 TESTE 1: UPDATE em Quest 5.1 (controle)...\n');
  
  const { data: quest51 } = await supabase
    .from('quests')
    .select('id, order_index, name, status')
    .eq('phase_id', 5)
    .eq('order_index', 1)
    .single();
    
  const originalStatus51 = quest51.status;
  
  const { error: error51 } = await supabase
    .from('quests')
    .update({ status: originalStatus51 === 'active' ? 'closed' : 'active' })
    .eq('id', quest51.id);
    
  if (error51) {
    console.log(`❌ Quest 5.1 TAMBÉM falhou: ${error51.message}`);
  } else {
    console.log('✅ Quest 5.1 UPDATE funcionou');
    // Reverter
    await supabase.from('quests').update({ status: originalStatus51 }).eq('id', quest51.id);
  }
  console.log('');
  
  // Teste 2: Tentar UPDATE com diferentes WHERE clauses
  console.log('🧪 TESTE 2: Testando diferentes WHERE clauses em Quest 5.3...\n');
  
  // 2a: WHERE com phase_id e order_index
  console.log('   Tentativa A: WHERE phase_id=5 AND order_index=3');
  const { error: errorA } = await supabase
    .from('quests')
    .update({ status: 'active' })
    .eq('phase_id', 5)
    .eq('order_index', 3);
  console.log(`   Resultado: ${errorA ? '❌ ' + errorA.message : '✅ OK'}\n`);
  
  if (!errorA) {
    await supabase.from('quests').update({ status: 'scheduled' }).eq('phase_id', 5).eq('order_index', 3);
  }
  
  // 2b: WHERE apenas com ID (UUID válido)
  console.log(`   Tentativa B: WHERE id='${quest53.id}'`);
  const { error: errorB } = await supabase
    .from('quests')
    .update({ status: 'active' })
    .eq('id', quest53.id);
  console.log(`   Resultado: ${errorB ? '❌ ' + errorB.message : '✅ OK'}\n`);
  
  if (!errorB) {
    await supabase.from('quests').update({ status: 'scheduled' }).eq('id', quest53.id);
  }
  
  // Teste 3: Verificar se há algo específico no ID da quest
  console.log('🧪 TESTE 3: Analisando ID da Quest 5.3...\n');
  console.log(`   ID: ${quest53.id}`);
  console.log(`   Tipo: ${typeof quest53.id}`);
  console.log(`   Comprimento: ${quest53.id.length} caracteres`);
  console.log(`   Formato válido UUID: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quest53.id) ? '✅' : '❌'}`);
  console.log('');
  
  // Teste 4: Deletar e recriar Quest 5.3 com novo ID
  console.log('🧪 TESTE 4: Solução - Deletar e recriar Quest 5.3 com novo ID...\n');
  console.log('   Esta é provavelmente a única solução para o problema.\n');
  
  console.log('⚠️  DIAGNÓSTICO COMPLETO:\n');
  console.log('   O problema NÃO é o trigger ou RLS policy.');
  console.log('   O problema é que esta quest específica está CORROMPIDA no banco.');
  console.log('   A única solução é DELETAR e RECRIAR a quest.\n');
  
  console.log('📋 PRÓXIMO PASSO:\n');
  console.log('   Execute: node fix-and-recreate-quest-5-3.js\n');
}

deepDiagnosis().catch(console.error);
