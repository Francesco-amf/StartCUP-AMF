require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyQuestTimings() {
  console.log('🔍 VERIFICAÇÃO COMPLETA DOS TEMPOS DAS QUESTS\n');
  console.log('='.repeat(80));
  
  // Buscar todas as quests que já foram iniciadas
  const { data: quests } = await supabase
    .from('quests')
    .select('*')
    .not('started_at', 'is', null)
    .order('phase_id', { ascending: true })
    .order('order_index', { ascending: true });
  
  if (!quests || quests.length === 0) {
    console.log('❌ Nenhuma quest foi iniciada ainda!');
    return;
  }
  
  const now = new Date();
  console.log(`⏰ Horário atual: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT\n`);
  
  console.log('='.repeat(80));
  console.log('📊 ANÁLISE DETALHADA DE CADA QUEST:\n');
  
  let totalProblems = 0;
  let totalQuests = 0;
  let questsOnTime = 0;
  let questsLate = 0;
  let questsEarly = 0;
  
  for (const quest of quests) {
    totalQuests++;
    const startTime = new Date(quest.started_at);
    const plannedEnd = new Date(startTime.getTime() + quest.planned_deadline_minutes * 60 * 1000);
    const lateWindow = new Date(plannedEnd.getTime() + (quest.late_submission_window_minutes || 0) * 60 * 1000);
    
    console.log(`\n📝 ${quest.name} (Fase ${quest.phase_id}.${quest.order_index})`);
    console.log('─'.repeat(80));
    console.log(`Status: ${quest.status}`);
    console.log(`Iniciou: ${startTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
    console.log(`Deadline planejado: ${plannedEnd.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
    console.log(`  (${quest.planned_deadline_minutes} minutos)`);
    
    if (quest.late_submission_window_minutes) {
      console.log(`Janela de atraso: ${lateWindow.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
      console.log(`  (+${quest.late_submission_window_minutes} minutos extras)`);
    }
    
    // Verificar se foi fechada
    if (quest.ended_at) {
      const endTime = new Date(quest.ended_at);
      console.log(`\n✅ Fechou em: ${endTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
      
      // Calcular diferença entre fechamento e deadline
      const diffMinutes = Math.round((endTime - plannedEnd) / (1000 * 60));
      
      if (diffMinutes <= 0) {
        console.log(`✅ Fechou NO PRAZO (${Math.abs(diffMinutes)} min antes do deadline)`);
        questsOnTime++;
      } else if (diffMinutes <= (quest.late_submission_window_minutes || 0)) {
        console.log(`⚠️  Fechou na JANELA DE ATRASO (${diffMinutes} min após deadline)`);
        questsLate++;
      } else {
        console.log(`❌ Fechou MUITO ATRASADO (${diffMinutes} min após deadline)`);
        totalProblems++;
        questsLate++;
      }
      
      // Verificar tempo total de execução
      const executionTime = Math.round((endTime - startTime) / (1000 * 60));
      const expectedTime = quest.planned_deadline_minutes + (quest.late_submission_window_minutes || 0);
      console.log(`Tempo total de execução: ${executionTime} min (esperado: ${expectedTime} min)`);
      
    } else if (quest.status === 'active') {
      console.log(`\n🔄 QUEST ATIVA AGORA`);
      const timeElapsed = Math.round((now - startTime) / (1000 * 60));
      const timeRemaining = Math.round((plannedEnd - now) / (1000 * 60));
      
      console.log(`Tempo decorrido: ${timeElapsed} min`);
      
      if (timeRemaining > 0) {
        console.log(`⏱️  Tempo restante: ${timeRemaining} min`);
      } else {
        const overtime = Math.abs(timeRemaining);
        console.log(`⚠️  PASSOU DO DEADLINE há ${overtime} min`);
        
        if (quest.late_submission_window_minutes) {
          const lateRemaining = Math.round((lateWindow - now) / (1000 * 60));
          if (lateRemaining > 0) {
            console.log(`⏱️  Ainda na janela de atraso (${lateRemaining} min restantes)`);
          } else {
            console.log(`❌ PASSOU DA JANELA DE ATRASO há ${Math.abs(lateRemaining)} min!`);
            totalProblems++;
          }
        } else {
          totalProblems++;
        }
      }
      
    } else if (quest.status === 'closed' && !quest.ended_at) {
      console.log(`\n❌ PROBLEMA: Status "closed" mas ended_at é NULL!`);
      totalProblems++;
      
    } else if (quest.status === 'pending') {
      console.log(`\n⏳ Quest ainda não foi ativada (pending)`);
    }
    
    // Verificar se foi aberta no horário correto
    if (quest.order_index > 1) {
      // Buscar quest anterior
      const { data: previousQuest } = await supabase
        .from('quests')
        .select('*')
        .eq('phase_id', quest.phase_id)
        .eq('order_index', quest.order_index - 1)
        .single();
      
      if (previousQuest && previousQuest.ended_at) {
        const prevClosed = new Date(previousQuest.ended_at);
        const timeBetween = Math.round((startTime - prevClosed) / (1000 * 60));
        
        console.log(`\n📊 Sequência:`);
        console.log(`  Quest anterior fechou: ${prevClosed.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        console.log(`  Esta quest abriu: ${startTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        console.log(`  Intervalo: ${timeBetween} minutos`);
        
        if (timeBetween < 0) {
          console.log(`  ❌ ERRO: Quest abriu ANTES da anterior fechar!`);
          totalProblems++;
        } else if (timeBetween <= 5) {
          console.log(`  ✅ Transição rápida e correta`);
        } else {
          console.log(`  ⚠️  Delay de ${timeBetween} min entre quests`);
        }
      }
    }
  }
  
  // Resumo geral
  console.log('\n' + '='.repeat(80));
  console.log('📈 RESUMO GERAL:\n');
  console.log(`Total de quests iniciadas: ${totalQuests}`);
  console.log(`  ✅ Fechadas no prazo: ${questsOnTime}`);
  console.log(`  ⚠️  Fechadas com atraso: ${questsLate}`);
  console.log(`  🔄 Ainda ativas: ${quests.filter(q => q.status === 'active').length}`);
  console.log(`  ⏳ Ainda pendentes: ${quests.filter(q => q.status === 'pending' || q.status === 'scheduled').length}`);
  console.log(`\n❌ Problemas detectados: ${totalProblems}`);
  
  // Verificar event_config
  console.log('\n' + '='.repeat(80));
  console.log('⚙️  CONFIGURAÇÃO DO EVENTO:\n');
  
  const { data: config } = await supabase
    .from('event_config')
    .select('*')
    .single();
  
  const eventStart = new Date(config.event_start_time);
  const phase1Start = new Date(config.phase_1_start_time);
  
  console.log(`Evento iniciado: ${config.event_started ? 'SIM' : 'NÃO'}`);
  console.log(`Fase atual: ${config.current_phase}`);
  console.log(`Event start time: ${eventStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
  console.log(`Phase 1 start time: ${phase1Start.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`);
  
  // Verificar sincronização
  const firstQuest = quests[0];
  if (firstQuest) {
    const firstQuestStart = new Date(firstQuest.started_at);
    const diffMs = Math.abs(phase1Start - firstQuestStart);
    
    console.log(`\n🔍 Sincronização:`);
    console.log(`  phase_1_start_time: ${phase1Start.toISOString()}`);
    console.log(`  Quest 1.1 started_at: ${firstQuestStart.toISOString()}`);
    console.log(`  Diferença: ${diffMs} ms`);
    
    if (diffMs < 1000) {
      console.log(`  ✅ PERFEITAMENTE SINCRONIZADO!`);
    } else {
      console.log(`  ⚠️  Diferença de ${Math.round(diffMs / 1000)} segundos`);
    }
  }
  
  // Conclusão final
  console.log('\n' + '='.repeat(80));
  if (totalProblems === 0 && questsOnTime + questsLate === quests.filter(q => q.ended_at).length) {
    console.log('✅ TUDO OK! As quests estão funcionando perfeitamente!');
  } else if (totalProblems === 0) {
    console.log('⚠️  Sistema funcional, mas há quests ainda em execução.');
  } else {
    console.log(`❌ ATENÇÃO: ${totalProblems} problema(s) detectado(s)!`);
    console.log('\nRecomendações:');
    console.log('1. Verificar logs do QuestAutoAdvancer');
    console.log('2. Confirmar que browser está aberto na live-dashboard');
    console.log('3. Checar se pg_cron está ativo para auto-advance de fase');
  }
  console.log('='.repeat(80));
}

verifyQuestTimings().catch(console.error);
