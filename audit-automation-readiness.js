require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditAutomationReadiness() {
  console.log('🔍 AUDITORIA COMPLETA DE PRONTIDÃO PARA AUTOMAÇÃO\n');
  console.log('='.repeat(80));
  
  const issues = [];
  const warnings = [];
  const ok = [];
  
  // ============================================================================
  // 1. VERIFICAR TIPOS DE COLUNAS (TIMEZONE)
  // ============================================================================
  console.log('\n1️⃣  VERIFICANDO TIPOS DE COLUNAS DE TIMESTAMP...\n');
  
  // Verificação manual conhecida: timestamp without time zone
  warnings.push({
    severity: 'MÉDIO',
    categoria: 'Timezone',
    problema: 'Colunas de timestamp são "timestamp without time zone"',
    impacto: 'Displays podem mostrar hora errada (±3h), mas cálculos funcionam',
    solucao: 'Executar FIX-TIMEZONE-SCHEMA.sql para converter para TIMESTAMPTZ',
    urgencia: 'Opcional - não afeta funcionalidade, apenas visual'
  });
  
  // ============================================================================
  // 2. VERIFICAR DADOS FANTASMAS (ended_at em quests não finalizadas)
  // ============================================================================
  console.log('\n2️⃣  VERIFICANDO DADOS FANTASMAS EM QUESTS...\n');
  
  const { data: ghostData } = await supabase
    .from('quests')
    .select('id, name, status, started_at, ended_at')
    .or('status.eq.scheduled,status.eq.active')
    .not('ended_at', 'is', null);
  
  if (ghostData && ghostData.length > 0) {
    issues.push({
      severity: 'ALTO',
      categoria: 'Dados Inválidos',
      problema: `${ghostData.length} quest(s) agendada(s)/ativa(s) têm ended_at preenchido`,
      impacto: 'Cálculos de tempo impossíveis, auto-advance pode falhar',
      solucao: 'Executar CLEAN-INVALID-ENDED-AT.sql ou resetar sistema',
      urgencia: 'URGENTE - limpar antes do evento'
    });
  } else {
    ok.push('✅ Nenhum dado fantasma em quests');
  }
  
  // ============================================================================
  // 3. VERIFICAR QUESTS COM started_at MAS SEM status CORRETO
  // ============================================================================
  console.log('\n3️⃣  VERIFICANDO CONSISTÊNCIA DE STATUS...\n');
  
  const { data: inconsistentQuests } = await supabase
    .from('quests')
    .select('id, name, status, started_at, ended_at')
    .not('started_at', 'is', null)
    .eq('status', 'scheduled');
  
  if (inconsistentQuests && inconsistentQuests.length > 0) {
    issues.push({
      severity: 'CRÍTICO',
      categoria: 'Inconsistência',
      problema: `${inconsistentQuests.length} quest(s) têm started_at mas status='scheduled'`,
      impacto: 'Quest não será reconhecida como ativa, submissions podem falhar',
      solucao: 'Atualizar status ou limpar started_at',
      urgencia: 'CRÍTICO - corrigir imediatamente'
    });
  } else {
    ok.push('✅ Status de quests consistente com timestamps');
  }
  
  // ============================================================================
  // 4. VERIFICAR DURAÇÕES PLANEJADAS
  // ============================================================================
  console.log('\n4️⃣  VERIFICANDO DURAÇÕES PLANEJADAS...\n');
  
  const { data: questsWithoutDuration } = await supabase
    .from('quests')
    .select('id, name, planned_deadline_minutes, late_submission_window_minutes')
    .or('planned_deadline_minutes.is.null,planned_deadline_minutes.eq.0');
  
  if (questsWithoutDuration && questsWithoutDuration.length > 0) {
    issues.push({
      severity: 'CRÍTICO',
      categoria: 'Configuração',
      problema: `${questsWithoutDuration.length} quest(s) sem duração planejada`,
      impacto: 'Auto-close não funcionará, deadline será 0 ou null',
      solucao: 'Configurar planned_deadline_minutes para todas as quests',
      urgencia: 'CRÍTICO - configurar antes do evento'
    });
  } else {
    ok.push('✅ Todas as quests têm duração configurada');
  }
  
  // ============================================================================
  // 5. VERIFICAR EVENT_CONFIG
  // ============================================================================
  console.log('\n5️⃣  VERIFICANDO CONFIGURAÇÃO DO EVENTO...\n');
  
  const { data: config } = await supabase
    .from('event_config')
    .select('*')
    .single();
  
  if (!config) {
    issues.push({
      severity: 'CRÍTICO',
      categoria: 'Configuração',
      problema: 'event_config não existe',
      impacto: 'Evento não pode iniciar',
      solucao: 'Criar registro em event_config',
      urgencia: 'CRÍTICO - resolver imediatamente'
    });
  } else {
    // Verificar se está em estado inicial correto
    if (config.event_started && config.current_phase === 0) {
      warnings.push({
        severity: 'MÉDIO',
        categoria: 'Configuração',
        problema: 'event_started=true mas current_phase=0',
        impacto: 'Estado inconsistente, pode confundir lógica',
        solucao: 'Resetar evento ou iniciar fase 1',
        urgencia: 'Resolver antes de iniciar evento real'
      });
    } else {
      ok.push('✅ event_config em estado consistente');
    }
    
    // Verificar se timestamps de fases estão consistentes
    if (config.current_phase > 0) {
      const expectedField = `phase_${config.current_phase}_start_time`;
      if (!config[expectedField]) {
        issues.push({
          severity: 'ALTO',
          categoria: 'Timestamps',
          problema: `Fase ${config.current_phase} ativa mas ${expectedField} é NULL`,
          impacto: 'Auto-advance de quest pode falhar',
          solucao: 'Preencher timestamp da fase atual',
          urgencia: 'URGENTE'
        });
      }
    }
  }
  
  // ============================================================================
  // 6. VERIFICAR SEQUÊNCIA DE QUESTS
  // ============================================================================
  console.log('\n6️⃣  VERIFICANDO SEQUÊNCIA DE QUESTS...\n');
  
  const { data: allQuests } = await supabase
    .from('quests')
    .select('id, phase_id, order_index, name')
    .order('phase_id', { ascending: true })
    .order('order_index', { ascending: true });
  
  let lastPhaseId = null;
  let lastOrderIndex = 0;
  const sequenceIssues = [];
  
  for (const quest of allQuests || []) {
    if (quest.phase_id !== lastPhaseId) {
      // Nova fase, resetar contador
      lastPhaseId = quest.phase_id;
      lastOrderIndex = 0;
    }
    
    if (quest.order_index !== lastOrderIndex + 1) {
      sequenceIssues.push(`Fase ${quest.phase_id}: gap entre ${lastOrderIndex} e ${quest.order_index}`);
    }
    
    lastOrderIndex = quest.order_index;
  }
  
  if (sequenceIssues.length > 0) {
    warnings.push({
      severity: 'BAIXO',
      categoria: 'Sequência',
      problema: `${sequenceIssues.length} gap(s) na sequência de quests`,
      impacto: 'Pode confundir lógica de "próxima quest"',
      solucao: 'Verificar order_index de quests',
      urgencia: 'Baixa - apenas organização'
    });
  } else {
    ok.push('✅ Sequência de quests correta');
  }
  
  // ============================================================================
  // 7. VERIFICAR LATE SUBMISSION WINDOW
  // ============================================================================
  console.log('\n7️⃣  VERIFICANDO JANELA DE LATE SUBMISSION...\n');
  
  const { data: questsWithoutLateWindow } = await supabase
    .from('quests')
    .select('id, name, late_submission_window_minutes')
    .is('late_submission_window_minutes', null);
  
  if (questsWithoutLateWindow && questsWithoutLateWindow.length > 0) {
    warnings.push({
      severity: 'BAIXO',
      categoria: 'Configuração',
      problema: `${questsWithoutLateWindow.length} quest(s) sem late_submission_window`,
      impacto: 'Equipes não terão tempo extra após deadline',
      solucao: 'Configurar late_submission_window_minutes (ex: 15)',
      urgencia: 'Opcional - depende das regras do evento'
    });
  } else {
    ok.push('✅ Todas as quests têm janela de late submission');
  }
  
  // ============================================================================
  // 8. VERIFICAR FASES
  // ============================================================================
  console.log('\n8️⃣  VERIFICANDO FASES...\n');
  
  const { data: phases } = await supabase
    .from('phases')
    .select('id, order_index, name, duration_minutes')
    .order('order_index');
  
  if (!phases || phases.length !== 5) {
    issues.push({
      severity: 'CRÍTICO',
      categoria: 'Estrutura',
      problema: `Esperado 5 fases, encontrado ${phases?.length || 0}`,
      impacto: 'Evento não funcionará corretamente',
      solucao: 'Seed completo de fases',
      urgencia: 'CRÍTICO'
    });
  } else {
    ok.push('✅ 5 fases configuradas corretamente');
  }
  
  // ============================================================================
  // RELATÓRIO FINAL
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL DE AUDITORIA\n');
  
  console.log(`✅ ITENS OK: ${ok.length}`);
  ok.forEach(item => console.log(`   ${item}`));
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  AVISOS: ${warnings.length}`);
    warnings.forEach((w, i) => {
      console.log(`\n   ${i + 1}. [${w.severity}] ${w.categoria}: ${w.problema}`);
      console.log(`      Impacto: ${w.impacto}`);
      console.log(`      Solução: ${w.solucao}`);
      console.log(`      Urgência: ${w.urgencia}`);
    });
  }
  
  if (issues.length > 0) {
    console.log(`\n❌ PROBLEMAS CRÍTICOS: ${issues.length}`);
    issues.forEach((issue, i) => {
      console.log(`\n   ${i + 1}. [${issue.severity}] ${issue.categoria}: ${issue.problema}`);
      console.log(`      Impacto: ${issue.impacto}`);
      console.log(`      Solução: ${issue.solucao}`);
      console.log(`      Urgência: ${issue.urgencia}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('🎉 TUDO PRONTO! Sistema 100% preparado para automação!');
  } else if (issues.length === 0) {
    console.log('✅ PRONTO COM RESSALVAS - Avisos podem ser ignorados se forem intencionais');
  } else {
    console.log('⚠️  AÇÃO NECESSÁRIA - Resolver problemas críticos antes do evento!');
  }
  
  console.log('='.repeat(80) + '\n');
}

auditAutomationReadiness().catch(console.error);
