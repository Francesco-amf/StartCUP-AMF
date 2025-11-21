require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncPhaseTimestamp() {
  console.log('🔄 Sincronizando phase_1_start_time...\n');
  
  // Buscar started_at da Quest 1.1
  const { data: quest } = await supabase
    .from('quests')
    .select('started_at')
    .eq('phase_id', 1)
    .eq('order_index', 1)
    .single();
  
  const questStart = quest.started_at;
  console.log('Valor correto (Quest 1.1 started_at):', questStart);
  console.log('BRT:', new Date(questStart).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  
  // Atualizar phase_1_start_time
  const { error } = await supabase
    .from('event_config')
    .update({ phase_1_start_time: questStart })
    .eq('id', '00000000-0000-0000-0000-000000000001');
  
  if (error) {
    console.error('\n❌ Erro:', error);
    return;
  }
  
  console.log('\n✅ Atualização concluída!');
  
  // Verificar
  const { data: updated } = await supabase
    .from('event_config')
    .select('phase_1_start_time')
    .single();
  
  console.log('\nNovo valor de phase_1_start_time:', updated.phase_1_start_time);
  console.log('BRT:', new Date(updated.phase_1_start_time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  
  if (updated.phase_1_start_time === questStart) {
    console.log('\n✅ SINCRONIZADO PERFEITAMENTE!\n');
  }
}

syncPhaseTimestamp();
