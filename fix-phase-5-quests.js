require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPhase5Quests() {
  console.log('🔧 CORRIGINDO QUESTS DA FASE 5\n');
  console.log('='.repeat(80));
  console.log('\n');
  
  // Verificar dados ANTES
  console.log('📋 ANTES das correções:\n');
  const { data: beforeQuests } = await supabase
    .from('quests')
    .select('order_index, name, description, max_points, duration_minutes')
    .eq('phase_id', 5)
    .order('order_index');
  
  beforeQuests?.forEach(q => {
    console.log(`Quest 5.${q.order_index}: ${q.name}`);
    console.log(`  Description: ${q.description}`);
    console.log(`  Max Points: ${q.max_points}`);
    console.log('');
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('APLICANDO CORREÇÕES...\n');
  
  // Quest 5.1 - A História Épica
  console.log('🔧 Corrigindo Quest 5.1...');
  const { error: error1 } = await supabase
    .from('quests')
    .update({
      name: 'Quest 5.1 - A História Épica',
      description: 'Estruturar narrativa do pitch + storytelling da solução (Pitch de 5 minutos)',
      max_points: 75,
      duration_minutes: 20,
      planned_deadline_minutes: 20,
      late_submission_window_minutes: 15,
      deliverable_type: '["file"]'
    })
    .eq('phase_id', 5)
    .eq('order_index', 1);
  
  if (error1) {
    console.error('❌ Erro ao atualizar Quest 5.1:', error1);
    return;
  }
  console.log('✅ Quest 5.1 atualizada\n');
  
  // Quest 5.2 - Slides de Impacto
  console.log('🔧 Corrigindo Quest 5.2...');
  const { error: error2 } = await supabase
    .from('quests')
    .update({
      name: 'Quest 5.2 - Slides de Impacto',
      description: 'Criar apresentação visual, sequência de slides: Capa → Dor/Necessidade → Solução → Mercado → Faturamento → Livre',
      max_points: 50,
      duration_minutes: 40,
      planned_deadline_minutes: 40,
      late_submission_window_minutes: 15,
      deliverable_type: '["file","url"]'
    })
    .eq('phase_id', 5)
    .eq('order_index', 2);
  
  if (error2) {
    console.error('❌ Erro ao atualizar Quest 5.2:', error2);
    return;
  }
  console.log('✅ Quest 5.2 atualizada\n');
  
  // Quest 5.3 - Ensaio Geral (CORREÇÃO CRÍTICA)
  console.log('🔧 Corrigindo Quest 5.3 (CRÍTICO - 30s → 5min)...');
  const { error: error3 } = await supabase
    .from('quests')
    .update({
      name: 'Quest 5.3 - Ensaio Geral',
      description: 'Treinar pitch + ajustar timing (5 minutos)',
      max_points: 25,
      duration_minutes: 30,
      planned_deadline_minutes: 30,
      late_submission_window_minutes: 15,
      deliverable_type: '["file"]'
    })
    .eq('phase_id', 5)
    .eq('order_index', 3);
  
  if (error3) {
    console.error('❌ Erro ao atualizar Quest 5.3:', error3);
    return;
  }
  console.log('✅ Quest 5.3 atualizada - ERRO CRÍTICO CORRIGIDO!\n');
  
  console.log('='.repeat(80));
  console.log('📋 DEPOIS das correções:\n');
  
  // Verificar dados DEPOIS
  const { data: afterQuests } = await supabase
    .from('quests')
    .select('order_index, name, description, max_points, duration_minutes, deliverable_type')
    .eq('phase_id', 5)
    .order('order_index');
  
  afterQuests?.forEach(q => {
    console.log(`Quest 5.${q.order_index}: ${q.name}`);
    console.log(`  Description: ${q.description}`);
    console.log(`  Max Points: ${q.max_points}`);
    console.log(`  Duration: ${q.duration_minutes} minutos`);
    console.log(`  Deliverable Type: ${q.deliverable_type}`);
    console.log('');
  });
  
  console.log('='.repeat(80));
  console.log('✅ ✅ ✅ CORREÇÕES CONCLUÍDAS COM SUCESSO! ✅ ✅ ✅');
  console.log('='.repeat(80));
  console.log('\n');
  console.log('📌 RESUMO:');
  console.log('   Quest 5.1: "Documento Executivo" → "A História Épica" (75pts, 5min pitch)');
  console.log('   Quest 5.2: max_points 100 → 50pts');
  console.log('   Quest 5.3: "Vídeo Pitch (30s)" → "Ensaio Geral (5 minutos)" [CRÍTICO]');
  console.log('\n');
}

fixPhase5Quests().catch(console.error);
