require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateResetProblem() {
  console.log('🔍 INVESTIGANDO PROBLEMA DO RESET\n');
  console.log('='.repeat(80));
  
  // 1. Verificar event_config
  console.log('\n1️⃣  EVENT CONFIG:\n');
  const { data: config } = await supabase
    .from('event_config')
    .select('*')
    .single();
  
  if (config) {
    console.log('Current Phase:', config.current_phase);
    console.log('Event Started:', config.event_started);
    console.log('Phase 1 Start:', config.phase_1_start_time);
    console.log('Phase 2 Start:', config.phase_2_start_time);
    console.log('Event Start Time:', config.event_start_time);
  }
  
  // 2. Verificar quests
  console.log('\n2️⃣  QUESTS (primeiras 5):\n');
  const { data: quests } = await supabase
    .from('quests')
    .select('id, phase_id, order_index, name, status, started_at, ended_at, started_by')
    .order('phase_id')
    .order('order_index')
    .limit(5);
  
  if (quests) {
    quests.forEach(q => {
      console.log(`\n${q.phase_id}.${q.order_index} ${q.name}`);
      console.log(`   Status: ${q.status}`);
      console.log(`   Started at: ${q.started_at || 'NULL'}`);
      console.log(`   Ended at: ${q.ended_at || 'NULL'}`);
      console.log(`   Started by: ${q.started_by || 'NULL'}`);
    });
  }
  
  // 3. Verificar boss_battles
  console.log('\n3️⃣  BOSS BATTLES:\n');
  const { data: bosses } = await supabase
    .from('boss_battles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (bosses && bosses.length > 0) {
    console.log(`❌ ENCONTRADO ${bosses.length} boss battle(s)!`);
    bosses.forEach((boss, i) => {
      console.log(`\n   ${i + 1}. Boss ${boss.boss_number}`);
      console.log(`      Status: ${boss.status}`);
      console.log(`      Team: ${boss.team_id}`);
      console.log(`      Created: ${boss.created_at}`);
      console.log(`      Started: ${boss.started_at || 'NULL'}`);
      console.log(`      Completed: ${boss.completed_at || 'NULL'}`);
    });
  } else {
    console.log('✅ Nenhum boss battle encontrado (correto após reset)');
  }
  
  // 4. Verificar submissions
  console.log('\n4️⃣  SUBMISSIONS:\n');
  const { data: submissions, count: submCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact' })
    .limit(5);
  
  console.log(`Total: ${submCount || 0}`);
  if (submissions && submissions.length > 0) {
    console.log(`❌ ENCONTRADO ${submissions.length} submission(s)!`);
    submissions.forEach((sub, i) => {
      console.log(`   ${i + 1}. Quest: ${sub.quest_id} | Team: ${sub.team_id} | ${sub.created_at}`);
    });
  } else {
    console.log('✅ Nenhuma submission (correto após reset)');
  }
  
  // 5. Verificar evaluations
  console.log('\n5️⃣  EVALUATIONS:\n');
  const { data: evaluations, count: evalCount } = await supabase
    .from('evaluations')
    .select('*', { count: 'exact' })
    .limit(5);
  
  console.log(`Total: ${evalCount || 0}`);
  if (evaluations && evaluations.length > 0) {
    console.log(`❌ ENCONTRADO ${evaluations.length} evaluation(s)!`);
  } else {
    console.log('✅ Nenhuma evaluation (correto após reset)');
  }
  
  // 6. Verificar penalties
  console.log('\n6️⃣  PENALTIES:\n');
  const { data: penalties, count: penCount } = await supabase
    .from('penalties')
    .select('*', { count: 'exact' })
    .limit(5);
  
  console.log(`Total: ${penCount || 0}`);
  if (penalties && penalties.length > 0) {
    console.log(`❌ ENCONTRADO ${penalties.length} penalt(ies)!`);
  } else {
    console.log('✅ Nenhuma penalty (correto após reset)');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIAGNÓSTICO:\n');
  
  const problems = [];
  
  if (config?.current_phase !== 0) {
    problems.push('❌ Event config não voltou para fase 0');
  }
  
  if (config?.event_started !== false) {
    problems.push('❌ Event started não foi resetado para false');
  }
  
  if (bosses && bosses.length > 0) {
    problems.push('❌ Boss battles NÃO foram deletados!');
  }
  
  if (submCount && submCount > 0) {
    problems.push('❌ Submissions NÃO foram deletadas!');
  }
  
  if (evalCount && evalCount > 0) {
    problems.push('❌ Evaluations NÃO foram deletadas!');
  }
  
  if (penCount && penCount > 0) {
    problems.push('❌ Penalties NÃO foram deletadas!');
  }
  
  const questsWithStarted = quests?.filter(q => q.started_at !== null).length || 0;
  if (questsWithStarted > 0) {
    problems.push(`❌ ${questsWithStarted} quest(s) ainda têm started_at`);
  }
  
  if (problems.length > 0) {
    console.log('⚠️  PROBLEMAS ENCONTRADOS:\n');
    problems.forEach(p => console.log(`   ${p}`));
    console.log('\n💡 CAUSA PROVÁVEL: Reset não deletou boss_battles!');
    console.log('   O código de reset precisa incluir DELETE de boss_battles.');
  } else {
    console.log('✅ Reset funcionou corretamente!');
  }
  
  console.log('='.repeat(80) + '\n');
}

investigateResetProblem().catch(console.error);
