require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkQuest53() {
  console.log('🔍 Verificando Quest 5.3...\n');
  
  // Buscar fase 5
  const { data: phase5, error: phaseError } = await supabase
    .from('phases')
    .select('id, order_index, name')
    .eq('order_index', 5)
    .single();
    
  if (phaseError) {
    console.error('❌ Erro ao buscar Fase 5:', phaseError);
    return;
  }
  
  console.log(`✅ Fase 5 encontrada: ${phase5.name} (ID: ${phase5.id})\n`);
  
  // Buscar todas as quests da fase 5
  const { data: quests, error: questsError } = await supabase
    .from('quests')
    .select('*')
    .eq('phase_id', phase5.id)
    .order('order_index');
    
  if (questsError) {
    console.error('❌ Erro ao buscar quests:', questsError);
    return;
  }
  
  console.log(`📋 Quests da Fase 5 (Total: ${quests.length}):\n`);
  quests.forEach(q => {
    console.log(`  [${q.order_index}] ${q.name}`);
    console.log(`      ID: ${q.id}`);
    console.log(`      Status: ${q.status}`);
    console.log(`      Phase ID: ${q.phase_id}`);
    console.log('');
  });
  
  // Verificar se a quest 5.3 existe
  const quest53 = quests.find(q => q.order_index === 3);
  
  if (!quest53) {
    console.log('❌ Quest 5.3 NÃO encontrada! (Provavelmente é a causa do erro)\n');
  } else {
    console.log(`✅ Quest 5.3 encontrada:\n`);
    console.log(JSON.stringify(quest53, null, 2));
    console.log('\n');
    
    // Tentar fazer um UPDATE de teste
    console.log('🧪 Testando UPDATE na Quest 5.3...\n');
    const { error: updateError } = await supabase
      .from('quests')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', quest53.id);
      
    if (updateError) {
      console.error('❌ ERRO no UPDATE (Este é o problema!):', updateError);
      console.log('\n⚠️ A Quest 5.3 está corrompida e precisa ser recriada!\n');
    } else {
      console.log('✅ UPDATE funcionou (Quest 5.3 está OK)\n');
      
      // Reverter o teste
      await supabase
        .from('quests')
        .update({ status: 'scheduled', started_at: null })
        .eq('id', quest53.id);
    }
  }
}

checkQuest53().catch(console.error);
