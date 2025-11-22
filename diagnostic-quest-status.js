// DIAGNÓSTICO: Verificar estado de Quest 1.1 e 1.2
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nbplpqlbscbdqtltqqvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icGxwcWxic2NiZHF0bHRxcXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDI1MDc4NjgsImV4cCI6MjAxODA4Mzg2OH0.c1-uGScIgdNMEzVrqwVtKzlzqbXG7A6iUwrqvXDSaMs'
);

async function diagnostic() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║ VERIFICANDO ESTADO DE QUEST 1.1 E 1.2                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // 1. Verificar Quest 1.1
  console.log('=== QUEST 1.1 ===');
  const { data: quest1_1, error: err1 } = await supabase
    .from('quests')
    .select('id, name, status, order_index, started_at')
    .eq('order_index', 1)
    .order('created_at', { ascending: false })
    .limit(1);

  if (err1) console.error('❌ Erro ao buscar Quest 1.1:', err1);
  else if (quest1_1 && quest1_1.length > 0) {
    const q = quest1_1[0];
    const started = new Date(q.started_at);
    const deadline = new Date(started.getTime() + 45 * 60000); // 45 min
    const now = new Date();
    const minutos = Math.round((deadline - now) / 60000);
    
    console.log(`✅ ID: ${q.id}`);
    console.log(`📝 Nome: ${q.name}`);
    console.log(`🔴 Status: ${q.status}`);
    console.log(`⏱️  Iniciou: ${q.started_at}`);
    console.log(`⏰ Deadline (45min): ${deadline.toLocaleString('pt-BR')}`);
    console.log(`📊 Minutos restantes: ${minutos}`);
    console.log(`🎯 Situação: ${minutos <= 0 ? '🔴 EXPIRADA' : minutos <= 15 ? '⚠️  ATRASADA' : '🟢 ATIVA'}\n`);
  }

  // 2. Verificar Quest 1.2
  console.log('=== QUEST 1.2 ===');
  const { data: quest1_2, error: err2 } = await supabase
    .from('quests')
    .select('id, name, status, order_index, started_at')
    .eq('order_index', 2)
    .order('created_at', { ascending: false })
    .limit(1);

  if (err2) console.error('❌ Erro ao buscar Quest 1.2:', err2);
  else if (quest1_2 && quest1_2.length > 0) {
    const q = quest1_2[0];
    console.log(`✅ ID: ${q.id}`);
    console.log(`📝 Nome: ${q.name}`);
    console.log(`🔴 Status: ${q.status}`);
    console.log(`⏰ Iniciou: ${q.started_at}\n`);
  }

  // 3. Contar submissões de Quest 1.1
  console.log('=== SUBMISSÕES QUEST 1.1 ===');
  if (quest1_1 && quest1_1.length > 0) {
    const { data: subs, error: err3 } = await supabase
      .from('submissions')
      .select('team_id, created_at', { count: 'exact' })
      .eq('quest_id', quest1_1[0].id);

    if (err3) console.error('❌ Erro ao contar submissões:', err3);
    else {
      console.log(`✅ Total de submissões para Quest 1.1: ${subs?.length || 0}`);
      const teams = [...new Set(subs?.map(s => s.team_id) || [])];
      console.log(`✅ Equipes com submissão: ${teams.length}\n`);
    }
  }

  // 4. Análise final
  console.log('=== ANÁLISE FINAL ===');
  if (quest1_1 && quest1_1.length > 0) {
    const q1 = quest1_1[0];
    const started = new Date(q1.started_at);
    const deadline = new Date(started.getTime() + 45 * 60000);
    const now = new Date();
    const minutos = Math.round((deadline - now) / 60000);
    const is_expired = minutos <= 0;
    const is_submitted = true; // Se chegou aqui, foi submetido

    console.log(`Quest 1.1 status: ${q1.status}`);
    console.log(`Quest 1.1 expirada?: ${is_expired ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log(`Quest 1.1 tem submissões?: SIM ✅`);
    
    if (quest1_2 && quest1_2.length > 0) {
      const q2 = quest1_2[0];
      console.log(`Quest 1.2 status: ${q2.status}`);
      console.log(`\n🔍 CONCLUSÃO:`);
      
      if (q2.status === 'active') {
        console.log(`✅ Quest 1.2 ESTÁ ATIVA no banco`);
        console.log(`⚠️  MAS não aparece para as equipes`);
        console.log(`→ PROBLEMA: Frontend bloqueio em SubmissionWrapper.tsx`);
        console.log(`→ MOTIVO: Quest 1.1 precisa estar EXPIRADA ou ter bloqueio removido`);
      } else {
        console.log(`❌ Quest 1.2 NÃO ESTÁ ATIVA`);
        console.log(`→ PROBLEMA: Auto-advance não funcionou`);
        console.log(`→ MOTIVO: Função auto_start_next_quest() pode ter erro`);
      }
    }
  }

  console.log('\n');
}

diagnostic().catch(console.error);
