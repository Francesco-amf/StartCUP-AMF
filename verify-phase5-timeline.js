require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyPhase5Timeline() {
  console.log('🕐 VERIFICAÇÃO: Quando Fase 5 REALMENTE começou?\n');
  console.log('='.repeat(80));
  console.log('\n');
  
  // Buscar event_config
  const { data: config } = await supabase
    .from('event_config')
    .select('phase_5_start_time')
    .single();
  
  const toLocal = (utcDate) => {
    if (!utcDate) return 'N/A';
    const date = new Date(utcDate);
    return date.toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      hour12: false 
    });
  };
  
  console.log('📋 PHASE 5 START TIME (database):\n');
  console.log(`UTC: ${config.phase_5_start_time || 'N/A'}`);
  console.log(`Local (BRT): ${toLocal(config.phase_5_start_time)}`);
  console.log('');
  
  // Buscar primeira quest da Fase 5
  const { data: firstQuest } = await supabase
    .from('quests')
    .select('id, name, order_index, started_at, planned_deadline_minutes')
    .eq('phase_id', 5)
    .eq('order_index', 1)
    .single();
  
  if (firstQuest) {
    console.log('📋 PRIMEIRA QUEST DA FASE 5:\n');
    console.log(`Quest 5.1: ${firstQuest.name}`);
    console.log(`Started at (UTC): ${firstQuest.started_at || 'N/A'}`);
    console.log(`Started at (Local): ${toLocal(firstQuest.started_at)}`);
    console.log(`Planned deadline: ${firstQuest.planned_deadline_minutes} minutos`);
    console.log('');
    
    if (firstQuest.started_at) {
      const start = new Date(firstQuest.started_at);
      const deadline = new Date(start.getTime() + firstQuest.planned_deadline_minutes * 60 * 1000);
      console.log(`Deadline calculado: ${toLocal(deadline.toISOString())}`);
    }
  }
  
  // Buscar todas as quests para ver timeline real
  const { data: allQuests } = await supabase
    .from('quests')
    .select('order_index, name, started_at, planned_deadline_minutes, late_submission_window_minutes')
    .eq('phase_id', 5)
    .order('order_index');
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 TIMELINE COMPLETA DA FASE 5:\n');
  
  let totalMinutes = 0;
  allQuests?.forEach(q => {
    console.log(`Quest 5.${q.order_index}: ${q.name}`);
    console.log(`  Started: ${toLocal(q.started_at)}`);
    console.log(`  Deadline: ${q.planned_deadline_minutes} min (late window: ${q.late_submission_window_minutes || 0} min)`);
    
    if (q.started_at && q.planned_deadline_minutes) {
      const start = new Date(q.started_at);
      const deadline = new Date(start.getTime() + q.planned_deadline_minutes * 60 * 1000);
      console.log(`  Deadline calculado: ${toLocal(deadline.toISOString())}`);
      totalMinutes += q.planned_deadline_minutes;
    }
    console.log('');
  });
  
  console.log('='.repeat(80));
  console.log(`\n📌 TOTAL PLANEJADO: ${totalMinutes} minutos (${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}min)\n`);
  
  // Calcular fim esperado baseado em started_at real
  if (firstQuest?.started_at) {
    const phase5Start = new Date(firstQuest.started_at);
    const expectedEnd = new Date(phase5Start.getTime() + 90 * 60 * 1000); // 90 min
    const expectedEventEnd = new Date(expectedEnd.getTime() + 20 * 60 * 1000); // +20 min
    
    console.log('🎯 CÁLCULO BASEADO NO HORÁRIO REAL DE INÍCIO:\n');
    console.log(`Fase 5 começou: ${toLocal(phase5Start.toISOString())}`);
    console.log(`Deveria terminar em: ${toLocal(expectedEnd.toISOString())} (+ 1h30min)`);
    console.log(`Evento deveria terminar em: ${toLocal(expectedEventEnd.toISOString())} (+ 20min avaliação)`);
    console.log('');
    console.log(`Evento terminou em: 22:00 (reportado)`);
    console.log('');
    
    // Calcular diferença
    const reported = new Date('2025-11-20T22:00:00-03:00');
    const diff = (reported - expectedEventEnd) / (1000 * 60);
    console.log(`Diferença: ${Math.round(diff)} minutos`);
  }
  
  console.log('\n' + '='.repeat(80));
}

verifyPhase5Timeline().catch(console.error);
