require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditAllQuests() {
  console.log('🔍 AUDITORIA COMPLETA - Todas as Quests\n');
  console.log('='.repeat(80));
  console.log('\n');
  
  // Buscar todas as fases
  const { data: phases, error: phasesError } = await supabase
    .from('phases')
    .select('id, order_index, name')
    .order('order_index');
    
  if (phasesError) {
    console.error('❌ Erro ao buscar fases:', phasesError);
    return;
  }
  
  console.log(`✅ ${phases.length} fases encontradas\n`);
  
  // Para cada fase, buscar quests
  for (const phase of phases) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`FASE ${phase.order_index}: ${phase.name}`);
    console.log(`Phase ID: ${phase.id}`);
    console.log(`${'='.repeat(80)}\n`);
    
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .eq('phase_id', phase.id)
      .order('order_index');
      
    if (questsError) {
      console.error(`❌ Erro ao buscar quests da Fase ${phase.order_index}:`, questsError);
      continue;
    }
    
    if (!quests || quests.length === 0) {
      console.log('⚠️  Nenhuma quest encontrada para esta fase\n');
      continue;
    }
    
    console.log(`📋 Total de quests: ${quests.length}\n`);
    
    quests.forEach((q, idx) => {
      console.log(`${'─'.repeat(80)}`);
      console.log(`Quest ${phase.order_index}.${q.order_index} - ${q.name}`);
      console.log(`${'─'.repeat(80)}`);
      console.log(`  ID: ${q.id}`);
      console.log(`  Description: ${q.description}`);
      console.log(`  Max Points: ${q.max_points}`);
      console.log(`  Duration: ${q.duration_minutes} minutos`);
      console.log(`  Deliverable Type: ${q.deliverable_type}`);
      console.log(`  Status: ${q.status}`);
      console.log(`  Requirements: ${q.requirements || 'N/A'}`);
      console.log(`  Evaluation Criteria: ${q.evaluation_criteria || 'N/A'}`);
      console.log(`  Tips: ${q.tips || 'N/A'}`);
      console.log(`  Accepted Formats: ${q.accepted_formats || 'N/A'}`);
      console.log(`  AMF Coins: ${q.amf_coins || 'N/A'}`);
      console.log('');
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('AUDITORIA CONCLUÍDA');
  console.log('='.repeat(80) + '\n');
  
  // Exportar para arquivo JSON
  const allQuestsData = [];
  for (const phase of phases) {
    const { data: quests } = await supabase
      .from('quests')
      .select('*')
      .eq('phase_id', phase.id)
      .order('order_index');
    
    allQuestsData.push({
      phase: phase.order_index,
      phaseName: phase.name,
      phaseId: phase.id,
      quests: quests || []
    });
  }
  
  const fs = require('fs');
  fs.writeFileSync(
    'quest-audit-results.json',
    JSON.stringify(allQuestsData, null, 2),
    'utf8'
  );
  
  console.log('📄 Resultados exportados para: quest-audit-results.json\n');
}

auditAllQuests().catch(console.error);
