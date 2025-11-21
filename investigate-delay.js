require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateDelay() {
  console.log('🔍 INVESTIGAÇÃO DO ATRASO DE 40 MINUTOS\n');
  console.log('='.repeat(80));
  console.log('\n');
  
  console.log('❓ CENÁRIO REPORTADO:\n');
  console.log('19:30 - Faltavam 1h30min para terminar Fase 5');
  console.log('21:00 - Fase 5 deveria terminar (19:30 + 1h30min)');
  console.log('21:20 - Evento deveria terminar (21:00 + 20min avaliação)');
  console.log('22:00 - Evento REALMENTE terminou');
  console.log('⏰ ATRASO: 40 minutos\n');
  console.log('='.repeat(80));
  console.log('\n');
  
  // Buscar configuração atual
  const { data: config } = await supabase
    .from('event_config')
    .select('*')
    .single();
  
  const toLocal = (utcDate) => {
    if (!utcDate) return 'N/A';
    const date = new Date(utcDate);
    return date.toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      hour12: false 
    });
  };
  
  console.log('📋 DADOS ATUAIS DO EVENT_CONFIG:\n');
  console.log(`Phase 5 Start Time: ${toLocal(config.phase_5_start_time)}`);
  console.log(`Evaluation Period End: ${toLocal(config.evaluation_period_end_time)}`);
  console.log(`Event End Time: ${toLocal(config.event_end_time)}`);
  console.log(`Current Phase: ${config.current_phase}`);
  console.log(`Event Ended: ${config.event_ended}`);
  console.log('');
  
  // Buscar fase 5
  const { data: phase5 } = await supabase
    .from('phases')
    .select('*')
    .eq('order_index', 5)
    .single();
  
  console.log('⏰ FASE 5 - CONFIGURAÇÃO:\n');
  console.log(`Duration (planned): ${phase5.duration_minutes} minutos (1h30min)`);
  console.log('');
  
  // Buscar quests da Fase 5
  const { data: quests } = await supabase
    .from('quests')
    .select('order_index, name, duration_minutes, planned_deadline_minutes, late_submission_window_minutes, started_at, ended_at, status')
    .eq('phase_id', 5)
    .order('order_index');
  
  console.log('📋 QUESTS DA FASE 5 - TIMELINE REAL:\n');
  
  let totalPlannedMinutes = 0;
  let totalActualMinutes = 0;
  
  quests?.forEach(q => {
    console.log(`Quest 5.${q.order_index}: ${q.name}`);
    console.log(`  Status: ${q.status}`);
    console.log(`  Duração planejada: ${q.duration_minutes} min`);
    if (q.planned_deadline_minutes) {
      console.log(`  Deadline planejado: ${q.planned_deadline_minutes} min`);
    }
    if (q.late_submission_window_minutes) {
      console.log(`  Janela de atraso permitida: ${q.late_submission_window_minutes} min`);
    }
    console.log(`  Started: ${toLocal(q.started_at)}`);
    console.log(`  Ended: ${toLocal(q.ended_at)}`);
    
    if (q.started_at && q.ended_at) {
      const start = new Date(q.started_at);
      const end = new Date(q.ended_at);
      const actualMinutes = (end - start) / (1000 * 60);
      console.log(`  ⏱️  Duração REAL: ${Math.round(actualMinutes)} minutos`);
      totalActualMinutes += actualMinutes;
    }
    
    totalPlannedMinutes += (q.planned_deadline_minutes || q.duration_minutes || 0);
    console.log('');
  });
  
  console.log('='.repeat(80));
  console.log('📊 RESUMO:\n');
  console.log(`Total planejado (soma das quests): ${totalPlannedMinutes} min`);
  console.log(`Total real (se todas foram cronometradas): ${Math.round(totalActualMinutes)} min`);
  console.log('');
  
  console.log('🔍 POSSÍVEIS CAUSAS DO ATRASO:\n');
  
  console.log('1️⃣ JANELA DE ATRASO (late_submission_window):');
  const totalLateWindow = quests.reduce((sum, q) => sum + (q.late_submission_window_minutes || 0), 0);
  console.log(`   Cada quest tem ${quests[0]?.late_submission_window_minutes || 0} min de janela de atraso`);
  console.log(`   Total de janelas: ${totalLateWindow} min (${quests.length} quests × 15min)`);
  console.log('');
  
  console.log('2️⃣ AUTO-START vs MANUAL START:');
  console.log('   Se as quests foram iniciadas MANUALMENTE com delays entre elas,');
  console.log('   isso adicionaria tempo extra ao evento.');
  console.log('');
  
  console.log('3️⃣ EVALUATION PERIOD (20 minutos):');
  console.log('   Período de avaliação após Fase 5 = 20 minutos (fixo)');
  console.log('');
  
  console.log('='.repeat(80));
  console.log('💡 ANÁLISE FINAL:\n');
  
  const expectedEnd = new Date('2025-11-20T21:20:00-03:00'); // 21:20 esperado
  const actualEnd = new Date('2025-11-20T22:00:00-03:00');   // 22:00 real
  const delayMinutes = (actualEnd - expectedEnd) / (1000 * 60);
  
  console.log(`Atraso reportado: ${delayMinutes} minutos`);
  console.log('');
  
  if (totalLateWindow >= 30) {
    console.log('✅ HIPÓTESE MAIS PROVÁVEL:');
    console.log(`   Janelas de submissão atrasada (${totalLateWindow} min total) explicam`);
    console.log(`   grande parte do atraso de ${delayMinutes} minutos.`);
    console.log('');
    console.log('   Se as equipes usaram as janelas de late submission,');
    console.log('   o evento naturalmente estendeu o tempo planejado.');
  }
  
  console.log('\n' + '='.repeat(80));
}

investigateDelay().catch(console.error);
