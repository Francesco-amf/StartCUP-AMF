require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeFixImpact() {
  console.log('🔍 ANÁLISE DE IMPACTO DA CORREÇÃO DE TIMEZONE\n');
  console.log('='.repeat(80));
  
  // 1. Buscar todos os timestamps atuais
  const { data: config } = await supabase
    .from('event_config')
    .select('*')
    .single();
  
  const { data: quests } = await supabase
    .from('quests')
    .select('id, name, phase_id, order_index, status, started_at, ended_at, closed_at, planned_deadline_minutes')
    .order('phase_id', { ascending: true })
    .order('order_index', { ascending: true });
  
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, quest_id, submitted_at')
    .not('submitted_at', 'is', null);
  
  console.log('\n📊 ESTADO ATUAL DO SISTEMA:\n');
  console.log('Event started:', config.event_started);
  console.log('Current phase:', config.current_phase);
  console.log('Quests ativas:', quests?.filter(q => q.status === 'active').length || 0);
  console.log('Quests fechadas:', quests?.filter(q => q.status === 'closed').length || 0);
  console.log('Total submissions:', submissions?.length || 0);
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 CAMPOS QUE SERIAM AFETADOS:\n');
  
  const fieldsToFix = [];
  
  // Verificar event_config
  if (config.event_start_time) {
    const current = new Date(config.event_start_time);
    const corrected = new Date(current.getTime() - 3 * 60 * 60 * 1000); // -3 horas
    fieldsToFix.push({
      table: 'event_config',
      field: 'event_start_time',
      current: current.toISOString(),
      currentBRT: current.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      corrected: corrected.toISOString(),
      correctedBRT: corrected.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    });
  }
  
  for (let i = 1; i <= 5; i++) {
    const field = `phase_${i}_start_time`;
    if (config[field]) {
      const current = new Date(config[field]);
      const corrected = new Date(current.getTime() - 3 * 60 * 60 * 1000);
      fieldsToFix.push({
        table: 'event_config',
        field: field,
        current: current.toISOString(),
        currentBRT: current.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        corrected: corrected.toISOString(),
        correctedBRT: corrected.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      });
    }
  }
  
  console.log('Campos em event_config que precisam correção:', fieldsToFix.length);
  fieldsToFix.forEach(f => {
    console.log(`\n  ${f.field}:`);
    console.log(`    Atual:     ${f.currentBRT} (UTC: ${f.current})`);
    console.log(`    Corrigido: ${f.correctedBRT} (UTC: ${f.corrected})`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFICANDO QUESTS (NÃO DEVEM SER ALTERADAS):\n');
  
  const questsWithTimestamps = quests?.filter(q => q.started_at) || [];
  console.log(`Total de quests com started_at: ${questsWithTimestamps.length}`);
  
  if (questsWithTimestamps.length > 0) {
    console.log('\nPrimeira quest como exemplo:');
    const q = questsWithTimestamps[0];
    const startedAt = new Date(q.started_at);
    console.log(`  ${q.name}`);
    console.log(`  started_at (UTC): ${q.started_at}`);
    console.log(`  started_at (BRT): ${startedAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`  ✅ Este valor está CORRETO e NÃO deve ser alterado`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFICANDO SUBMISSIONS (NÃO DEVEM SER ALTERADAS):\n');
  
  console.log(`Total de submissions: ${submissions?.length || 0}`);
  if (submissions && submissions.length > 0) {
    const sub = submissions[0];
    const submittedAt = new Date(sub.submitted_at);
    console.log('\nPrimeira submission como exemplo:');
    console.log(`  submitted_at (UTC): ${sub.submitted_at}`);
    console.log(`  submitted_at (BRT): ${submittedAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    console.log(`  ✅ Este valor deve estar CORRETO e NÃO deve ser alterado`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  ANÁLISE DE IMPACTOS:\n');
  
  console.log('✅ IMPACTOS POSITIVOS:');
  console.log('   1. Relatórios de "quando o evento começou" ficarão corretos');
  console.log('   2. Displays de "tempo decorrido" ficarão corretos');
  console.log('   3. Logs de início de fase ficarão corretos');
  console.log('   4. Futuros eventos usarão timestamps corretos\n');
  
  console.log('❌ IMPACTOS NEGATIVOS POTENCIAIS:');
  
  // Verificar se há código que depende dos timestamps errados
  console.log('   1. Verificar se PhaseController usa phase_X_start_time para cálculos:');
  const activeQuest = quests?.find(q => q.status === 'active');
  if (activeQuest && activeQuest.started_at) {
    const questStart = new Date(activeQuest.started_at);
    const phaseStart = new Date(config[`phase_${config.current_phase}_start_time`]);
    const diff = Math.floor((phaseStart - questStart) / 60000);
    console.log(`      Diferença atual entre phase_start_time e quest.started_at: ${diff} minutos`);
    if (diff === 0) {
      console.log(`      ✅ Após correção, continuarão iguais (ambos estarão corretos)`);
    } else {
      console.log(`      ⚠️  Após correção, a diferença será: ${diff - 180} minutos`);
    }
  }
  
  console.log('\n   2. Verificar se há timers que dependem de phase_X_start_time:');
  console.log('      → PhaseController.tsx calcula tempo restante da fase');
  console.log('      → Se usar phase_start_time + duration, o cálculo ficará correto');
  console.log('      → Se usar quest.started_at (mais provável), não será afetado\n');
  
  console.log('   3. Verificar se há comparações entre timestamps:');
  console.log('      → Se comparar event_start_time com quest.started_at, pode quebrar');
  console.log('      → Mas provavelmente ninguém faz isso\n');
  
  console.log('\n' + '='.repeat(80));
  console.log('🔧 ESTRATÉGIA DE CORREÇÃO RECOMENDADA:\n');
  
  console.log('OPÇÃO 1 - Correção Retroativa (recomendada se evento já começou):');
  console.log('  1. Alterar tipo das colunas para timestamptz');
  console.log('  2. Subtrair 3 horas dos valores existentes em event_config');
  console.log('  3. NÃO alterar valores em quests e submissions (já estão corretos)');
  console.log('  4. Testar se PhaseController continua funcionando\n');
  
  console.log('OPÇÃO 2 - Correção Futura (recomendada se evento ainda não começou):');
  console.log('  1. Alterar tipo das colunas para timestamptz');
  console.log('  2. Resetar evento (voltar para fase 0)');
  console.log('  3. Começar evento novamente com timestamps corretos\n');
  
  console.log('OPÇÃO 3 - Não Corrigir (manter como está):');
  console.log('  1. Sistema funciona normalmente (quests estão corretas)');
  console.log('  2. Apenas relatórios mostram horário errado');
  console.log('  3. Menos risco de quebrar algo durante evento ativo\n');
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 RECOMENDAÇÃO:\n');
  
  if (config.current_phase > 0 && questsWithTimestamps.length > 0) {
    console.log('⚠️  EVENTO JÁ ESTÁ RODANDO!');
    console.log('   → OPÇÃO 3 (Não corrigir agora) é a mais segura');
    console.log('   → Sistema funciona, apenas displays mostram hora errada');
    console.log('   → Corrigir depois do evento terminar');
    console.log('   → Ou corrigir agora APENAS se você testar bem o PhaseController');
  } else {
    console.log('✅ Evento ainda não começou ou está em preparação');
    console.log('   → OPÇÃO 1 ou 2 são seguras');
    console.log('   → Corrigir agora evita problemas futuros');
  }
  
  console.log('\n✅ Análise completa!\n');
}

analyzeFixImpact();
