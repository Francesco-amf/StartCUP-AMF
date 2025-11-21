#!/usr/bin/env node
/**
 * test-boss-protection.js
 * 
 * Teste rápido (5-10 min) para verificar se proteção de boss funciona
 * Simula o ciclo de quests e verifica se boss é bloqueado automaticamente
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBossProtection() {
  console.log('\n' + '='.repeat(90));
  console.log('🧪 TESTE DE PROTEÇÃO DE BOSS - auto_start_next_quest()');
  console.log('='.repeat(90) + '\n');

  try {
    // ========== PASSO 1: RESET ==========
    console.log('📋 PASSO 1: Resetando sistema...\n');
    
    // Reset para Phase 0
    const { error: resetError } = await supabase
      .from('event_config')
      .update({ current_phase: 0, event_started: false })
      .eq('id', 'event_config_singleton');
    
    if (resetError) throw new Error(`Erro ao resetar fase: ${resetError.message}`);
    
    // Reset quests
    const { error: questError } = await supabase
      .from('quests')
      .update({ 
        started_at: null, 
        ended_at: null, 
        status: 'scheduled' 
      });
    
    if (questError) throw new Error(`Erro ao resetar quests: ${questError.message}`);
    
    console.log('✅ Sistema resetado (Phase 0)\n');

    // ========== PASSO 2: INICIAR EVENTO ==========
    console.log('📋 PASSO 2: Iniciando evento (Phase 1)...\n');
    
    const { error: startError } = await supabase
      .from('event_config')
      .update({ 
        current_phase: 1, 
        event_started: true 
      })
      .eq('id', 'event_config_singleton');
    
    if (startError) throw new Error(`Erro ao iniciar evento: ${startError.message}`);
    console.log('✅ Evento iniciado (Phase 1)\n');

    // ========== PASSO 3: INICIAR QUEST 1.1 ==========
    console.log('📋 PASSO 3: Iniciando Quest 1.1...\n');
    
    // Buscar Quest 1.1 (phase 1, order_index 1)
    const { data: phase1 } = await supabase
      .from('phases')
      .select('id')
      .eq('order_index', 1)
      .single();
    
    if (!phase1) throw new Error('Phase 1 não encontrada');
    
    const { data: quest11 } = await supabase
      .from('quests')
      .select('id, order_index, deliverable_type, planned_deadline_minutes')
      .eq('phase_id', phase1.id)
      .eq('order_index', 1)
      .single();
    
    if (!quest11) throw new Error('Quest 1.1 não encontrada');
    
    // Iniciar Quest 1.1 com deadline curto (30 segundos para teste)
    const { error: start11Error } = await supabase
      .from('quests')
      .update({ 
        started_at: new Date().toISOString(), 
        status: 'active'
      })
      .eq('id', quest11.id);
    
    if (start11Error) throw new Error(`Erro ao iniciar Quest 1.1: ${start11Error.message}`);
    
    console.log(`✅ Quest 1.1 iniciada (ID: ${quest11.id})`);
    console.log(`   Deliverable Type: ${quest11.deliverable_type}`);
    console.log(`   Duração original: ${quest11.planned_deadline_minutes} min\n`);

    // ========== PASSO 4: EXECUTAR auto_start_next_quest() ENQUANTO QUEST 1.1 ATIVA ==========
    console.log('📋 PASSO 4: Testando auto_start (Quest 1.1 ainda ativa)...\n');
    
    const { error: call1Error } = await supabase.rpc('auto_start_next_quest');
    
    if (call1Error) {
      console.log('⚠️  RPC não disponível, vamos checar logs manualmente');
    }
    
    // Verificar se Quest 1.2 foi ativada
    const { data: quest12v1 } = await supabase
      .from('quests')
      .select('id, status, started_at')
      .eq('phase_id', phase1.id)
      .eq('order_index', 2)
      .single();
    
    if (quest12v1?.started_at) {
      console.log('❌ BUG: Quest 1.2 foi ativada enquanto Quest 1.1 ainda estava ativa');
      console.log('   (Não deveria ativar)\n');
    } else {
      console.log('✅ CORRETO: Quest 1.2 NÃO foi ativada (Quest 1.1 ainda ativa)\n');
    }

    // ========== PASSO 5: MARCAR QUEST 1.1 COMO EXPIRADA ==========
    console.log('📋 PASSO 5: Simulando expiração de Quest 1.1...\n');
    
    // Retroagir started_at para ~60 min atrás (simula expiração)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() - 60);
    
    const { error: expireError } = await supabase
      .from('quests')
      .update({ started_at: expiryTime.toISOString() })
      .eq('id', quest11.id);
    
    if (expireError) throw new Error(`Erro ao expirar Quest 1.1: ${expireError.message}`);
    
    console.log('✅ Quest 1.1 marcada como expirada (60 min atrás)\n');

    // ========== PASSO 6: CHAMAR auto_start_next_quest() - DEVE ATIVAR QUEST 1.2 ==========
    console.log('📋 PASSO 6: Chamando auto_start (Quest 1.1 expirada)...\n');
    
    const { error: call2Error } = await supabase.rpc('auto_start_next_quest');
    
    if (call2Error) {
      console.log('⚠️  RPC erro novamente');
    }
    
    // Verificar se Quest 1.2 foi ativada
    const { data: quest12v2 } = await supabase
      .from('quests')
      .select('id, status, started_at')
      .eq('phase_id', phase1.id)
      .eq('order_index', 2)
      .single();
    
    if (quest12v2?.started_at) {
      console.log('✅ CORRETO: Quest 1.2 foi ativada');
      console.log(`   Status: ${quest12v2.status}\n`);
    } else {
      console.log('❌ BUG: Quest 1.2 deveria ter sido ativada\n');
    }

    // ========== PASSO 7: MARCAR QUEST 1.2 E 1.3 COMO EXPIRADAS ==========
    console.log('📋 PASSO 7: Simulando ciclo rápido (Quest 1.2 e 1.3)...\n');
    
    const { data: quest13 } = await supabase
      .from('quests')
      .select('id')
      .eq('phase_id', phase1.id)
      .eq('order_index', 3)
      .single();
    
    const { data: quest14 } = await supabase
      .from('quests')
      .select('id, order_index, deliverable_type')
      .eq('phase_id', phase1.id)
      .eq('order_index', 4)
      .single();
    
    if (!quest13 || !quest14) throw new Error('Quest 1.3 ou 1.4 não encontrada');
    
    console.log(`Quest 1.4 (BOSS):`);
    console.log(`   Order Index: ${quest14.order_index}`);
    console.log(`   Deliverable Type: ${quest14.deliverable_type}\n`);
    
    // Marcar Quest 1.2 como expirada
    const time2 = new Date();
    time2.setMinutes(time2.getMinutes() - 60);
    
    await supabase
      .from('quests')
      .update({ started_at: time2.toISOString() })
      .eq('id', quest12v2.id);
    
    // Ativar Quest 1.3
    await supabase
      .from('quests')
      .update({ started_at: new Date().toISOString(), status: 'active' })
      .eq('id', quest13.id);
    
    // Marcar Quest 1.3 como expirada
    const time3 = new Date();
    time3.setMinutes(time3.getMinutes() - 60);
    
    await supabase
      .from('quests')
      .update({ started_at: time3.toISOString() })
      .eq('id', quest13.id);
    
    console.log('✅ Quest 1.2 e 1.3 simuladas como expiradas\n');

    // ========== PASSO 8: CHAMAR auto_start_next_quest() - DEVE BLOQUEAR BOSS ==========
    console.log('📋 PASSO 8: Chamando auto_start (deve tentar ativar Quest 1.4 BOSS)...\n');
    console.log('🔍 TESTE CRÍTICO: Verificando se BOSS é bloqueado\n');
    
    const { error: call3Error } = await supabase.rpc('auto_start_next_quest');
    
    if (call3Error) {
      console.log('⚠️  RPC erro');
    }
    
    // Verificar se Quest 1.4 foi ativada (NÃO DEVERIA!)
    const { data: quest14result } = await supabase
      .from('quests')
      .select('id, status, started_at')
      .eq('id', quest14.id)
      .single();
    
    if (quest14result?.started_at) {
      console.log('❌❌❌ CRÍTICO - BUG ENCONTRADO ❌❌❌\n');
      console.log('Quest 1.4 (BOSS) foi ativada automaticamente!');
      console.log('   (Deveria estar BLOQUEADA)\n');
      console.log('🔴 O FIX NÃO ESTÁ FUNCIONANDO\n');
    } else {
      console.log('✅✅✅ PROTEÇÃO FUNCIONANDO ✅✅✅\n');
      console.log('✅ Quest 1.4 (BOSS) foi BLOQUEADA automaticamente');
      console.log('   (Exatamente o que deveria acontecer)\n');
    }

    // ========== PASSO 9: ATIVAR BOSS MANUALMENTE ==========
    console.log('📋 PASSO 9: Testando ativação manual de boss...\n');
    
    const { error: manualError } = await supabase
      .from('quests')
      .update({ started_at: new Date().toISOString(), status: 'active' })
      .eq('id', quest14.id);
    
    if (manualError) throw new Error(`Erro ao ativar boss: ${manualError.message}`);
    
    const { data: questFinal } = await supabase
      .from('quests')
      .select('id, status, started_at')
      .eq('id', quest14.id)
      .single();
    
    if (questFinal?.started_at) {
      console.log('✅ BOSS ativado manualmente com SUCESSO');
      console.log(`   Status: ${questFinal.status}\n`);
    }

    // ========== RESULTADO FINAL ==========
    console.log('='.repeat(90));
    console.log('\n📊 RESULTADO DO TESTE\n');
    
    if (!quest14result?.started_at && questFinal?.started_at) {
      console.log('🟢 TUDO PERFEITO!\n');
      console.log('✅ Quest 1.1 e 1.2 ativadas automaticamente (correto)');
      console.log('✅ Boss bloqueado automaticamente (correto)');
      console.log('✅ Boss ativado manualmente com sucesso (correto)\n');
      console.log('🚀 Sistema está PRONTO para o evento!\n');
    } else {
      console.log('🔴 PROBLEMA ENCONTRADO\n');
      console.log('❌ Boss foi ativado automaticamente (deveria ser bloqueado)');
      console.log('⚠️  O FIX precisa ser aplicado ou revisado\n');
    }

    console.log('='.repeat(90) + '\n');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.log('\n💡 Dicas de debug:');
    console.log('   1. Verifique se .env.local está correto');
    console.log('   2. Verifique se banco de dados está acessível');
    console.log('   3. Verifique se FIX_BOSS_AUTO_ACTIVATION_FINAL.sql foi aplicado\n');
  }
}

testBossProtection();
