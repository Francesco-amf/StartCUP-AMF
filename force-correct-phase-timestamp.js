require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function forceCorrectTimestamp() {
  console.log('🔧 Corrigindo phase_1_start_time (subtraindo 3 horas)...\n');
  
  // Buscar valor atual
  const { data: before } = await supabase
    .from('event_config')
    .select('phase_1_start_time')
    .single();
  
  const currentValue = new Date(before.phase_1_start_time);
  console.log('Valor atual (UTC):', before.phase_1_start_time);
  console.log('Valor atual (BRT):', currentValue.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  
  // Calcular novo valor (subtrair 3 horas)
  const correctedValue = new Date(currentValue.getTime() - 3 * 60 * 60 * 1000);
  const correctedISO = correctedValue.toISOString().replace('Z', ''); // Remove Z para timestamp without timezone
  
  console.log('\nNovo valor (UTC):', correctedISO);
  console.log('Novo valor (BRT):', correctedValue.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  
  // Atualizar
  const { error } = await supabase
    .from('event_config')
    .update({ phase_1_start_time: correctedISO })
    .eq('id', '00000000-0000-0000-0000-000000000001');
  
  if (error) {
    console.error('\n❌ Erro:', error);
    return;
  }
  
  console.log('\n✅ Atualização concluída!\n');
}

forceCorrectTimestamp();
