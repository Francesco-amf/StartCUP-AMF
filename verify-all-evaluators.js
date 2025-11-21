require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERRO: Variáveis não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAllEvaluators() {
  console.log('🔍 VERIFICANDO TODOS OS AVALIADORES...\n');
  console.log('='.repeat(80));
  
  // 1. Buscar todos os avaliadores da tabela evaluators
  const { data: evaluators, error: evalError } = await supabase
    .from('evaluators')
    .select('*')
    .order('name');
  
  if (evalError) {
    console.error('❌ Erro ao buscar avaliadores:', evalError.message);
    return;
  }
  
  console.log(`\n📊 Total de avaliadores na tabela: ${evaluators.length}\n`);
  
  let okCount = 0;
  let problemCount = 0;
  const problems = [];
  
  // 2. Verificar cada avaliador
  for (const evaluator of evaluators) {
    const status = {
      name: evaluator.name,
      email: evaluator.email,
      id: evaluator.id,
      issues: []
    };
    
    // Buscar dados do Auth
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(evaluator.id);
    
    if (authError || !authData.user) {
      status.issues.push('❌ Usuário não existe no Auth');
      problemCount++;
      problems.push(status);
      continue;
    }
    
    const user = authData.user;
    
    // Verificar email confirmado
    if (!user.email_confirmed_at) {
      status.issues.push('⚠️  Email não confirmado');
    }
    
    // Verificar user_metadata.role
    if (user.user_metadata?.role !== 'evaluator') {
      status.issues.push(`❌ user_metadata.role: "${user.user_metadata?.role}" (deveria ser "evaluator")`);
    }
    
    // Verificar app_metadata.role
    if (user.app_metadata?.role !== 'evaluator') {
      status.issues.push(`❌ app_metadata.role: "${user.app_metadata?.role}" (deveria ser "evaluator")`);
    }
    
    // Verificar provider
    if (user.app_metadata?.provider !== 'email') {
      status.issues.push(`⚠️  Provider: "${user.app_metadata?.provider}" (deveria ser "email")`);
    }
    
    // Verificar se tem senha (encrypted_password existe)
    if (!user.encrypted_password && !user.aud) {
      status.issues.push('❌ Sem senha configurada');
    }
    
    // Verificar role na tabela evaluators
    if (evaluator.role !== 'evaluator') {
      status.issues.push(`❌ Tabela evaluators role: "${evaluator.role}" (deveria ser "evaluator")`);
    }
    
    if (status.issues.length > 0) {
      problemCount++;
      problems.push(status);
    } else {
      okCount++;
    }
  }
  
  // 3. Mostrar resultados
  console.log('\n' + '='.repeat(80));
  console.log('📈 RESUMO:');
  console.log('='.repeat(80));
  console.log(`✅ Avaliadores OK: ${okCount}`);
  console.log(`❌ Avaliadores com problemas: ${problemCount}`);
  
  if (problems.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  PROBLEMAS ENCONTRADOS:');
    console.log('='.repeat(80));
    
    problems.forEach((problem, index) => {
      console.log(`\n${index + 1}. ${problem.name} (${problem.email})`);
      console.log(`   ID: ${problem.id}`);
      problem.issues.forEach(issue => {
        console.log(`   ${issue}`);
      });
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMENDAÇÃO:');
    console.log('='.repeat(80));
    console.log('Execute o script de correção para cada avaliador com problema.');
  } else {
    console.log('\n✅ Todos os avaliadores estão configurados corretamente!');
    console.log('✅ Todos podem fazer login sem problemas!');
  }
  
  // 4. Listar todos os avaliadores OK
  if (okCount > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('✅ AVALIADORES CONFIGURADOS CORRETAMENTE:');
    console.log('='.repeat(80));
    
    for (const evaluator of evaluators) {
      const problem = problems.find(p => p.id === evaluator.id);
      if (!problem) {
        console.log(`✅ ${evaluator.name} - ${evaluator.email}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

verifyAllEvaluators();
