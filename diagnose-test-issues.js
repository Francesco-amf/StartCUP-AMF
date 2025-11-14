// ============================================================================
// SCRIPT: Diagnosticar Problemas dos Testes
// ============================================================================
// Verifica:
// 1. Se submissões foram registradas corretamente
// 2. Se penalidades foram aplicadas
// 3. Se rankings foram calculados
// 4. Status de quests (atrasos, deadlines)
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnoseTestIssues() {
  console.log('🔍 DIAGNÓSTICO DE PROBLEMAS DOS TESTES\n');
  console.log('='.repeat(70) + '\n');

  // PROBLEMA 1: Verificar Quests (atraso entre quests)
  console.log('PROBLEMA 1: ATRASO ENTRE QUESTS\n');
  console.log('⏳ Verificando configuração de quests...\n');

  const { data: quests, error: questsError } = await supabase
    .from('quests')
    .select('id, description, order_index, status, planned_deadline_minutes, late_submission_window_minutes, started_at, ended_at')
    .order('order_index');

  if (questsError) {
    console.log('❌ Erro ao buscar quests:', questsError.message);
  } else {
    console.log(`📊 Total de quests: ${quests.length}\n`);

    quests.slice(0, 5).forEach(quest => {
      console.log(`Quest ${quest.order_index}: ${quest.description}`);
      console.log(`  Status: ${quest.status}`);
      console.log(`  Deadline: ${quest.planned_deadline_minutes} minutos`);
      console.log(`  Late window: ${quest.late_submission_window_minutes} minutos`);
      console.log(`  Iniciada em: ${quest.started_at ? new Date(quest.started_at).toLocaleString() : 'Não iniciada'}`);
      console.log(`  Encerrada em: ${quest.ended_at ? new Date(quest.ended_at).toLocaleString() : 'Não encerrada'}`);
      console.log('');
    });

    // Verificar se há quests com deadline zerado
    const zeroDeadlineQuests = quests.filter(q => q.planned_deadline_minutes === 0);
    if (zeroDeadlineQuests.length > 0) {
      console.log(`⚠️  ATENÇÃO: ${zeroDeadlineQuests.length} quest(s) com deadline = 0!`);
      console.log('   Isso causaria atraso imediato em TODA submissão\n');
    }
  }

  console.log('='.repeat(70) + '\n');

  // PROBLEMA 2: Verificar Penalidades (Áurea Forma)
  console.log('PROBLEMA 3: PENALIDADE DE ATRASO NÃO APLICADA\n');
  console.log('⏳ Verificando equipe "Áurea Forma"...\n');

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, email, name')
    .ilike('email', '%aurea%');

  if (teamsError) {
    console.log('❌ Erro ao buscar equipe:', teamsError.message);
  } else if (teams.length === 0) {
    console.log('⚠️  Equipe "Áurea Forma" não encontrada');
  } else {
    const aureaTeam = teams[0];
    console.log(`✅ Encontrada: ${aureaTeam.name} (${aureaTeam.email})\n`);

    // Verificar submissões da Áurea Forma
    const { data: submissions, error: submError } = await supabase
      .from('submissions')
      .select('id, quest_id, submitted_at, is_late, late_minutes, late_penalty_applied')
      .eq('team_id', aureaTeam.id)
      .order('submitted_at', { ascending: false })
      .limit(5);

    if (submError) {
      console.log('❌ Erro ao buscar submissões:', submError.message);
    } else {
      console.log(`📊 Últimas ${submissions.length} submissões da Áurea Forma:\n`);

      submissions.forEach((sub, idx) => {
        console.log(`Submissão ${idx + 1}:`);
        console.log(`  ID: ${sub.id}`);
        console.log(`  Atrasada: ${sub.is_late ? 'SIM (' + sub.late_minutes + ' min)' : 'NÃO'}`);
        console.log(`  Penalidade Aplicada: ${sub.late_penalty_applied ? sub.late_penalty_applied + ' pontos' : 'NENHUMA'}`);
        console.log(`  Enviada em: ${new Date(sub.submitted_at).toLocaleString()}`);
        console.log('');
      });

      // Verificar registros de penalidade
      const { data: penalties, error: penError } = await supabase
        .from('penalties')
        .select('id, penalty_type, points_deduction, reason, created_at')
        .eq('team_id', aureaTeam.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (penError) {
        console.log('❌ Erro ao buscar penalidades:', penError.message);
      } else {
        console.log(`📊 Penalidades registradas para Áurea Forma: ${penalties.length}\n`);

        if (penalties.length === 0) {
          console.log('⚠️  ATENÇÃO: Nenhuma penalidade registrada!');
          console.log('   Se há submissões atrasadas mas sem penalidades, há um BUG.\n');
        } else {
          penalties.forEach((pen, idx) => {
            console.log(`Penalidade ${idx + 1}:`);
            console.log(`  Tipo: ${pen.penalty_type}`);
            console.log(`  Pontos: -${pen.points_deduction}`);
            console.log(`  Motivo: ${pen.reason}`);
            console.log(`  Data: ${new Date(pen.created_at).toLocaleString()}`);
            console.log('');
          });
        }
      }

      // Verificar se tabela rankings existe
      const { data: testRank } = await supabase
        .from('rankings')
        .select('count(*)', { count: 'exact' })
        .limit(1);

      if (testRank !== null) {
        const { data: ranking, error: rankError } = await supabase
          .from('rankings')
          .select('team_id, total_points')
          .eq('team_id', aureaTeam.id)
          .single();

        if (ranking) {
          console.log(`📊 Ranking da Áurea Forma:`);
          console.log(`  Total de Pontos: ${ranking.total_points}`);
          console.log('');
        }
      } else {
        console.log('⚠️  Tabela rankings não existe ainda (será criada com cálculo de pontuação)\n');
      }
    }
  }

  console.log('='.repeat(70) + '\n');

  // VERIFICAÇÃO GERAL
  console.log('VERIFICAÇÃO GERAL\n');

  // Total de submissões
  const { data: allSubmissions, error: allSubError } = await supabase
    .from('submissions')
    .select('id', { count: 'exact' });

  // Total de penalidades
  const { data: allPenalties, error: allPenError } = await supabase
    .from('penalties')
    .select('id', { count: 'exact' });

  // Total de equipes
  const { data: allTeams, error: allTeamsError } = await supabase
    .from('teams')
    .select('id', { count: 'exact' });

  console.log(`📊 Estatísticas Gerais:`);
  console.log(`  Equipes: ${allTeams?.length || 0}`);
  console.log(`  Submissões Totais: ${allSubmissions?.length || 0}`);
  console.log(`  Penalidades Registradas: ${allPenalties?.length || 0}`);
  console.log('');

  // Submissões atrasadas vs penalidades
  const { data: lateSubmissions } = await supabase
    .from('submissions')
    .select('id', { count: 'exact' })
    .eq('is_late', true);

  if (lateSubmissions) {
    console.log(`⚠️  Submissões Atrasadas: ${lateSubmissions.length}`);
    console.log(`   Penalidades: ${allPenalties?.length || 0}`);
    if (lateSubmissions.length > (allPenalties?.length || 0)) {
      console.log(`   ❌ DISCREPÂNCIA: Há mais submissões atrasadas que penalidades!`);
    } else {
      console.log(`   ✅ OK: Penalidades parecem estar registradas`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Diagnóstico concluído!\n');
}

diagnoseTestIssues();
