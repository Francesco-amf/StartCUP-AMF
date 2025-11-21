#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
  console.log('\n=== DEBUG: Buscando Phases e Quests ===\n');

  // Buscar phases
  const { data: phases } = await supabase
    .from('phases')
    .select('id, order_index, title')
    .limit(5);

  console.log('PHASES:');
  phases.forEach(p => console.log(`  ${p.order_index}: ${p.title} (${p.id})`));

  // Buscar phase 1
  const { data: phase1 } = await supabase
    .from('phases')
    .select('id')
    .eq('order_index', 1)
    .single();

  if (phase1) {
    console.log(`\nPhase 1 ID: ${phase1.id}`);

    // Buscar quests de phase 1
    const { data: quests } = await supabase
      .from('quests')
      .select('id, order_index, title, status, started_at')
      .eq('phase_id', phase1.id)
      .order('order_index');

    console.log('\nQUESTS DE PHASE 1:');
    quests.forEach(q => {
      console.log(`  ${q.order_index}: ${q.title}`);
      console.log(`     Status: ${q.status}, Started: ${q.started_at ? 'SIM' : 'NÃO'}`);
    });
  } else {
    console.log('Phase 1 não encontrada!');
  }
}

debug();
