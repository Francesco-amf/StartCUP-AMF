require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEventTimeline() {
  console.log('🕐 ANÁLISE DO TIMELINE DO EVENTO\n');
  console.log('='.repeat(80));
  console.log('\n');
  
  // Buscar event_config
  const { data: config, error: configError } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();
  
  if (configError) {
    console.error('❌ Erro ao buscar event_config:', configError);
    return;
  }
  
  console.log('📋 EVENT CONFIG:\n');
  console.log(`Event Started: ${config.event_started}`);
  console.log(`Event Ended: ${config.event_ended}`);
  console.log(`Current Phase: ${config.current_phase}`);
  console.log('');
  
  // Converter para horário local (UTC-3)
  const toLocal = (utcDate) => {
    if (!utcDate) return 'N/A';
    const date = new Date(utcDate);
    return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };
  
  const calcDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const diff = new Date(end) - new Date(start);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };
  
  console.log('🕐 TIMESTAMPS (Horário de Brasília - UTC-3):\n');
  console.log(`Event Start Time:              ${toLocal(config.event_start_time)}`);
  console.log(`Phase 1 Start:                 ${toLocal(config.phase_1_start_time)}`);
  console.log(`Phase 2 Start:                 ${toLocal(config.phase_2_start_time)}`);
  console.log(`Phase 3 Start:                 ${toLocal(config.phase_3_start_time)}`);
  console.log(`Phase 4 Start:                 ${toLocal(config.phase_4_start_time)}`);
  console.log(`Phase 5 Start:                 ${toLocal(config.phase_5_start_time)}`);
  console.log(`Evaluation Period End:         ${toLocal(config.evaluation_period_end_time)}`);
  console.log(`Event End Time:                ${toLocal(config.event_end_time)}`);
  console.log('');
  
  console.log('⏱️  DURAÇÕES PLANEJADAS:\n');
  console.log(`Phase 1 → Phase 2: ${calcDuration(config.phase_1_start_time, config.phase_2_start_time)}`);
  console.log(`Phase 2 → Phase 3: ${calcDuration(config.phase_2_start_time, config.phase_3_start_time)}`);
  console.log(`Phase 3 → Phase 4: ${calcDuration(config.phase_3_start_time, config.phase_4_start_time)}`);
  console.log(`Phase 4 → Phase 5: ${calcDuration(config.phase_4_start_time, config.phase_5_start_time)}`);
  console.log(`Phase 5 → Eval End: ${calcDuration(config.phase_5_start_time, config.evaluation_period_end_time)}`);
  console.log(`Eval End → Event End: ${calcDuration(config.evaluation_period_end_time, config.event_end_time)}`);
  console.log('');
  
  console.log('📊 DURAÇÃO TOTAL DO EVENTO:\n');
  console.log(`Start → End: ${calcDuration(config.event_start_time, config.event_end_time)}`);
  console.log('');
  
  // Buscar quests da Fase 5 para ver duração planejada
  const { data: phase5 } = await supabase
    .from('phases')
    .select('id, duration_minutes')
    .eq('order_index', 5)
    .single();
  
  if (phase5) {
    console.log('⏰ FASE 5 - DURAÇÃO PLANEJADA:\n');
    console.log(`Duration: ${phase5.duration_minutes} minutos (${Math.floor(phase5.duration_minutes / 60)}h ${phase5.duration_minutes % 60}min)`);
    console.log('');
    
    const { data: quests } = await supabase
      .from('quests')
      .select('order_index, name, duration_minutes, started_at, ended_at')
      .eq('phase_id', phase5.id)
      .order('order_index');
    
    if (quests && quests.length > 0) {
      console.log('📋 QUESTS DA FASE 5:\n');
      quests.forEach(q => {
        console.log(`Quest 5.${q.order_index}: ${q.name}`);
        console.log(`  Duração planejada: ${q.duration_minutes} min`);
        console.log(`  Started at: ${toLocal(q.started_at)}`);
        console.log(`  Ended at: ${toLocal(q.ended_at)}`);
        if (q.started_at && q.ended_at) {
          console.log(`  Duração real: ${calcDuration(q.started_at, q.ended_at)}`);
        }
        console.log('');
      });
    }
  }
  
  console.log('='.repeat(80));
  console.log('🔍 ANÁLISE:\n');
  
  if (config.phase_5_start_time && config.evaluation_period_end_time) {
    const phase5Start = new Date(config.phase_5_start_time);
    const evalEnd = new Date(config.evaluation_period_end_time);
    const eventEnd = new Date(config.event_end_time);
    
    const phase5Duration = (evalEnd - phase5Start) / (1000 * 60); // em minutos
    const evalPeriodDuration = (eventEnd - evalEnd) / (1000 * 60); // em minutos
    
    console.log(`Fase 5 durou: ${Math.floor(phase5Duration / 60)}h ${Math.round(phase5Duration % 60)}min`);
    console.log(`Período de avaliação (após Fase 5): ${Math.round(evalPeriodDuration)} minutos`);
    console.log('');
    
    console.log('💡 OBSERVAÇÕES:');
    if (phase5Duration > 90) {
      console.log(`⚠️  Fase 5 durou ${Math.round(phase5Duration)}min (esperado: 90min = 1h30min)`);
      console.log(`   Diferença: +${Math.round(phase5Duration - 90)} minutos a mais`);
    }
    if (evalPeriodDuration > 20) {
      console.log(`⚠️  Período de avaliação durou ${Math.round(evalPeriodDuration)}min (esperado: 20min)`);
      console.log(`   Diferença: +${Math.round(evalPeriodDuration - 20)} minutos a mais`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

checkEventTimeline().catch(console.error);
