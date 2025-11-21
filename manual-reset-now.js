require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function manualReset() {
  console.log('🔧 EXECUTANDO RESET MANUAL COMPLETO\n');
  console.log('='.repeat(80));
  
  // 1. Resetar event_config
  console.log('\n1️⃣  Resetando event_config...');
  const { error: eventError } = await supabase
    .from('event_config')
    .update({
      current_phase: 0,
      event_started: false,
      event_ended: false,
      phase_1_start_time: null,
      phase_2_start_time: null,
      phase_3_start_time: null,
      phase_4_start_time: null,
      phase_5_start_time: null,
      event_start_time: null,
      event_end_time: null,
      evaluation_period_end_time: null,
      all_submissions_evaluated: false
    })
    .eq('id', '00000000-0000-0000-0000-000000000001');
  
  if (eventError) {
    console.log('❌ Erro:', eventError.message);
  } else {
    console.log('✅ Event config resetado');
  }
  
  // 2. Resetar TODAS as quests
  console.log('\n2️⃣  Resetando quests...');
  const { error: questError, count: questCount } = await supabase
    .from('quests')
    .update({
      status: 'scheduled',
      started_at: null,
      ended_at: null,
      started_by: null
    })
    .not('id', 'is', null);
  
  if (questError) {
    console.log('❌ Erro:', questError.message);
  } else {
    console.log(`✅ ${questCount} quests resetadas`);
  }
  
  // 3. Deletar boss_battles
  console.log('\n3️⃣  Deletando boss_battles...');
  const { error: bossError, count: bossCount } = await supabase
    .from('boss_battles')
    .delete()
    .not('id', 'is', null);
  
  if (bossError) {
    console.log('❌ Erro:', bossError.message);
  } else {
    console.log(`✅ ${bossCount || 0} boss battles deletados`);
  }
  
  // 4. Deletar submissions
  console.log('\n4️⃣  Deletando submissions...');
  const { error: submError, count: submCount } = await supabase
    .from('submissions')
    .delete()
    .not('id', 'is', null);
  
  if (submError) {
    console.log('❌ Erro:', submError.message);
  } else {
    console.log(`✅ ${submCount || 0} submissions deletadas`);
  }
  
  // 5. Deletar evaluations
  console.log('\n5️⃣  Deletando evaluations...');
  const { error: evalError, count: evalCount } = await supabase
    .from('evaluations')
    .delete()
    .not('id', 'is', null);
  
  if (evalError) {
    console.log('❌ Erro:', evalError.message);
  } else {
    console.log(`✅ ${evalCount || 0} evaluations deletadas`);
  }
  
  // 6. Deletar penalties
  console.log('\n6️⃣  Deletando penalties...');
  const { error: penError, count: penCount } = await supabase
    .from('penalties')
    .delete()
    .not('id', 'is', null);
  
  if (penError) {
    console.log('❌ Erro:', penError.message);
  } else {
    console.log(`✅ ${penCount || 0} penalties deletadas`);
  }
  
  // 7. Deletar power_ups
  console.log('\n7️⃣  Deletando power_ups...');
  const { error: powerError, count: powerCount } = await supabase
    .from('power_ups')
    .delete()
    .not('id', 'is', null);
  
  if (powerError) {
    console.log('❌ Erro:', powerError.message);
  } else {
    console.log(`✅ ${powerCount || 0} power-ups deletados`);
  }
  
  // 8. Deletar mentor_requests
  console.log('\n8️⃣  Deletando mentor_requests...');
  const { error: mentorError, count: mentorCount } = await supabase
    .from('mentor_requests')
    .delete()
    .not('id', 'is', null);
  
  if (mentorError) {
    console.log('❌ Erro:', mentorError.message);
  } else {
    console.log(`✅ ${mentorCount || 0} mentor requests deletados`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ RESET MANUAL COMPLETO!\n');
  
  // Verificar resultado
  console.log('📊 VERIFICAÇÃO FINAL:\n');
  
  const { data: configCheck } = await supabase
    .from('event_config')
    .select('current_phase, event_started')
    .single();
  
  console.log('Event config:');
  console.log(`   Phase: ${configCheck?.current_phase}`);
  console.log(`   Started: ${configCheck?.event_started}`);
  
  const { data: questsCheck } = await supabase
    .from('quests')
    .select('status')
    .neq('status', 'scheduled');
  
  console.log(`\nQuests não-scheduled: ${questsCheck?.length || 0}`);
  
  const { count: bossCheckCount } = await supabase
    .from('boss_battles')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Boss battles: ${bossCheckCount || 0}`);
  
  console.log('\n' + '='.repeat(80));
  
  if (configCheck?.current_phase === 0 && 
      configCheck?.event_started === false && 
      (questsCheck?.length || 0) === 0 &&
      (bossCheckCount || 0) === 0) {
    console.log('🎉 SISTEMA COMPLETAMENTE RESETADO!');
  } else {
    console.log('⚠️  Ainda há dados inconsistentes. Verifique manualmente.');
  }
  
  console.log('='.repeat(80) + '\n');
}

manualReset().catch(console.error);
