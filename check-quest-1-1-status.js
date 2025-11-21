#!/usr/bin/env node
/**
 * check-quest-1-1-status.js
 * 
 * Verifica se Quest 1.1 está correndo bem
 * Diagnóstico de timezone e boss ativação
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  console.log('\n' + '='.repeat(90));
  console.log('🔍 VERIFICANDO STATUS DE QUEST 1.1 - DIAGNÓSTICO');
  console.log('='.repeat(90) + '\n');

  try {
    // ===== VERIFICAR EVENT CONFIG =====
    console.log('📋 1. EVENTO E FASE\n');
    
    const { data: eventConfig } = await supabase
      .from('event_config')
      .select('*')
      .single();
    
    console.log(`   Current Phase: ${eventConfig.current_phase}`);
    console.log(`   Event Started: ${eventConfig.event_started}`);
    console.log(`   Last Updated: ${eventConfig.updated_at}\n`);

    // ===== VERIFICAR QUEST 1.1 =====
    console.log('📋 2. STATUS DE QUEST 1.1\n');
    
    const { data: phase1 } = await supabase
      .from('phases')
      .select('id')
      .eq('order_index', 1)
      .single();

    if (!phase1) {
      console.log('❌ Phase 1 não encontrada!');
      return;
    }

    const { data: quest11 } = await supabase
      .from('quests')
      .select('id, order_index, title, status, started_at, planned_deadline_minutes, late_submission_window_minutes')
      .eq('phase_id', phase1.id)
      .eq('order_index', 1)
      .single();

    if (!quest11) {
      console.log('❌ Quest 1.1 não encontrada!');
      return;
    }

    console.log(`   Quest 1.1: ${quest11.title}`);
    console.log(`   Status: ${quest11.status}`);
    console.log(`   Started: ${quest11.started_at}`);
    console.log(`   Planned Duration: ${quest11.planned_deadline_minutes} min`);
    console.log(`   Late Window: ${quest11.late_submission_window_minutes} min\n`);

    if (quest11.started_at) {
      const startTime = new Date(quest11.started_at);
      const now = new Date();
      const elapsedMin = Math.round((now - startTime) / 60000);
      const totalMin = quest11.planned_deadline_minutes + (quest11.late_submission_window_minutes || 0);
      
      console.log(`   ⏱️  Elapsed: ${elapsedMin} min`);
      console.log(`   ⏱️  Total Duration (with late window): ${totalMin} min`);
      console.log(`   ⏱️  Time Remaining: ${totalMin - elapsedMin} min\n`);

      if (elapsedMin > totalMin) {
        console.log(`   ⚠️  Quest 1.1 JÁ EXPIROU! (${elapsedMin} > ${totalMin})\n`);
      } else {
        console.log(`   ✅ Quest 1.1 ainda em andamento\n`);
      }
    }

    // ===== VERIFICAR PRÓXIMAS QUESTS =====
    console.log('📋 3. STATUS DE OUTRAS QUESTS DA FASE 1\n');

    const { data: allQuests } = await supabase
      .from('quests')
      .select('order_index, title, status, started_at, deliverable_type')
      .eq('phase_id', phase1.id)
      .order('order_index', { ascending: true });

    allQuests.forEach(q => {
      const isBoss = q.order_index === 4;
      const bossLabel = isBoss ? ' 🔴 BOSS' : '';
      console.log(`   Quest 1.${q.order_index}: ${q.title}${bossLabel}`);
      console.log(`      Status: ${q.status}`);
      console.log(`      Started: ${q.started_at ? 'SIM' : 'NÃO'}`);
      console.log(`      Deliverable: ${q.deliverable_type}\n`);
    });

    // ===== VERIFICAR BOSS BATTLES =====
    console.log('📋 4. VERIFICAR BOSS BATTLES\n');

    const { data: bossBattles } = await supabase
      .from('boss_battles')
      .select('*');

    console.log(`   Total de boss_battles: ${bossBattles.length}`);
    
    if (bossBattles.length > 0) {
      console.log('   ⚠️  Boss battles encontradas:');
      bossBattles.forEach(b => {
        console.log(`      - Quest ${b.quest_id}: Status ${b.status}`);
      });
    } else {
      console.log('   ✅ Sem boss_battles (correto)\n');
    }

    // ===== VERIFICAR TIMEZONE =====
    console.log('📋 5. VERIFICAÇÃO DE TIMEZONE\n');

    console.log(`   Server Time (agora): ${new Date().toISOString()}`);
    console.log(`   Your Timezone Offset: ${-new Date().getTimezoneOffset() / 60} hours\n`);

    if (quest11.started_at) {
      const startUTC = new Date(quest11.started_at);
      const now = new Date();
      const diffMin = Math.round((now - startUTC) / 60000);
      
      console.log(`   Quest 1.1 started (UTC): ${startUTC.toISOString()}`);
      console.log(`   Elapsed time (UTC): ${diffMin} min`);
      console.log(`   ✅ Timezone é UTC (sem conversão necessária)\n`);
    }

    // ===== VERIFICAR SUBMISSIONS =====
    console.log('📋 6. SUBMISSIONS E EVALUATIONS\n');

    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('quest_id', quest11.id);

    console.log(`   Submissions de Quest 1.1: ${submissions.length}`);

    if (submissions.length > 0) {
      submissions.forEach(s => {
        console.log(`      - Team: ${s.team_id}, Status: ${s.status}`);
      });
    }

    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('*')
      .eq('quest_id', quest11.id);

    console.log(`   Evaluations de Quest 1.1: ${evaluations.length}\n`);

    // ===== RESUMO FINAL =====
    console.log('='.repeat(90));
    console.log('\n📊 DIAGNÓSTICO FINAL\n');

    let allGood = true;

    if (quest11.status === 'active') {
      console.log('✅ Quest 1.1 está ATIVA (correto)');
    } else {
      console.log('❌ Quest 1.1 NÃO está ativa');
      allGood = false;
    }

    const questBoss = allQuests.find(q => q.order_index === 4);
    if (questBoss && !questBoss.started_at) {
      console.log('✅ Boss (Quest 1.4) NÃO foi ativada (correto)');
    } else if (questBoss && questBoss.started_at) {
      console.log('❌ ⚠️  PROBLEMA: Boss foi ativada enquanto Quest 1.1 está ativa!');
      allGood = false;
    }

    if (bossBattles.length === 0) {
      console.log('✅ Sem boss_battles orphans (correto)');
    } else {
      console.log('⚠️  Tem boss_battles que precisam ser investigadas');
      allGood = false;
    }

    if (allGood) {
      console.log('\n🟢 TUDO CORRENDO BEM! Nenhum problema de timezone ou boss detectado.\n');
    } else {
      console.log('\n🔴 PROBLEMAS DETECTADOS - Revise acima\n');
    }

    console.log('='.repeat(90) + '\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkStatus();
