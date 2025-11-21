require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateEvaluatorStructure() {
  console.log('🔍 INVESTIGANDO ESTRUTURA DE AVALIADORES\n');
  console.log('='.repeat(80));
  
  // 1. Ver todos os usuários no auth
  console.log('\n1️⃣  USUÁRIOS NO AUTH COM ROLE EVALUATOR:\n');
  
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const evaluators = authUsers.users.filter(u => 
    u.user_metadata?.role === 'evaluator'
  );
  
  evaluators.forEach(ev => {
    console.log(`📋 ${ev.user_metadata?.full_name || ev.email}`);
    console.log(`   Email: ${ev.email}`);
    console.log(`   ID: ${ev.id}`);
    console.log(`   Metadata:`, ev.user_metadata);
    console.log('');
  });
  
  // 2. Ver estrutura da tabela teams
  console.log('\n2️⃣  ESTRUTURA DA TABELA TEAMS:\n');
  
  const { data: sampleTeams } = await supabase
    .from('teams')
    .select('*')
    .limit(3);
  
  if (sampleTeams && sampleTeams.length > 0) {
    console.log('Colunas:', Object.keys(sampleTeams[0]));
    console.log('\nExemplo de registro:');
    console.log(JSON.stringify(sampleTeams[0], null, 2));
  }
  
  // 3. Ver quem está na tabela teams
  console.log('\n3️⃣  TODOS OS REGISTROS EM TEAMS:\n');
  
  const { data: allTeams } = await supabase
    .from('teams')
    .select('id, name, email')
    .order('name');
  
  if (allTeams) {
    allTeams.forEach(team => {
      console.log(`   ${team.name} - ${team.email}`);
    });
  }
  
  // 4. Comparar quem está no auth vs teams
  console.log('\n4️⃣  COMPARAÇÃO AUTH vs TEAMS:\n');
  
  const evaluatorEmails = evaluators.map(e => e.email);
  const teamEmails = allTeams?.map(t => t.email) || [];
  
  const inAuthNotInTeams = evaluatorEmails.filter(e => !teamEmails.includes(e));
  const inTeamsNotInAuth = teamEmails.filter(e => !evaluatorEmails.includes(e));
  
  if (inAuthNotInTeams.length > 0) {
    console.log('❌ No AUTH mas NÃO em TEAMS:');
    inAuthNotInTeams.forEach(e => console.log(`   - ${e}`));
  } else {
    console.log('✅ Todos avaliadores do auth estão em teams');
  }
  
  if (inTeamsNotInAuth.length > 0) {
    console.log('\n⚠️  Em TEAMS mas NÃO são avaliadores no AUTH:');
    inTeamsNotInAuth.forEach(e => console.log(`   - ${e}`));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 RESUMO:\n');
  console.log(`Total de avaliadores no auth: ${evaluators.length}`);
  console.log(`Total de registros em teams: ${allTeams?.length || 0}`);
  console.log(`Avaliadores faltando em teams: ${inAuthNotInTeams.length}`);
  console.log('='.repeat(80) + '\n');
}

investigateEvaluatorStructure().catch(console.error);
