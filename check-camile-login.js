require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCamileLogin() {
  console.log('🔍 VERIFICANDO LOGIN DA CAMILE SOUZA COSTA\n');
  console.log('Email: camile.souza@startcup-amf.com');
  console.log('Senha esperada: CSCEvaluator@2025!\n');
  console.log('='.repeat(80));
  
  // 1. Verificar se usuário existe na tabela auth.users
  console.log('\n1️⃣  VERIFICANDO USUÁRIO NO AUTH...\n');
  
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Erro ao listar usuários:', authError.message);
  } else {
    const camileAuth = authUsers.users.find(u => 
      u.email === 'camile.souza@startcup-amf.com'
    );
    
    if (camileAuth) {
      console.log('✅ Usuário encontrado no auth.users:');
      console.log('   ID:', camileAuth.id);
      console.log('   Email:', camileAuth.email);
      console.log('   Email confirmado:', camileAuth.email_confirmed_at ? '✅ SIM' : '❌ NÃO');
      console.log('   Criado em:', camileAuth.created_at);
      console.log('   Último login:', camileAuth.last_sign_in_at || 'Nunca fez login');
      console.log('   Metadata:', JSON.stringify(camileAuth.user_metadata, null, 2));
    } else {
      console.log('❌ USUÁRIO NÃO ENCONTRADO NO AUTH!');
      console.log('   Precisa criar o usuário primeiro.');
    }
  }
  
  // 2. Verificar se existe na tabela teams
  console.log('\n2️⃣  VERIFICANDO NA TABELA TEAMS...\n');
  
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('email', 'camile.souza@startcup-amf.com')
    .single();
  
  if (teamError) {
    if (teamError.code === 'PGRST116') {
      console.log('❌ EQUIPE NÃO ENCONTRADA NA TABELA TEAMS!');
      console.log('   Precisa cadastrar na tabela teams.');
    } else {
      console.error('❌ Erro ao buscar team:', teamError.message);
    }
  } else {
    console.log('✅ Encontrado na tabela teams:');
    console.log('   ID:', teamData.id);
    console.log('   Nome:', teamData.name);
    console.log('   Email:', teamData.email);
    console.log('   Role:', teamData.role);
    console.log('   Criado em:', teamData.created_at);
  }
  
  // 3. Tentar fazer login para testar senha
  console.log('\n3️⃣  TESTANDO LOGIN COM A SENHA FORNECIDA...\n');
  
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'camile.souza@startcup-amf.com',
    password: 'CSCEvaluator@2025!'
  });
  
  if (signInError) {
    console.log('❌ ERRO NO LOGIN:', signInError.message);
    
    if (signInError.message.includes('Invalid login credentials')) {
      console.log('\n⚠️  POSSÍVEIS CAUSAS:');
      console.log('   1. Senha incorreta no banco de dados');
      console.log('   2. Usuário não existe no auth.users');
      console.log('   3. Email não confirmado');
      console.log('   4. Usuário foi deletado/desabilitado');
    } else if (signInError.message.includes('Email not confirmed')) {
      console.log('\n⚠️  Email não confirmado! Precisa confirmar o email.');
    }
  } else {
    console.log('✅ LOGIN FUNCIONOU!');
    console.log('   User ID:', signInData.user?.id);
    console.log('   Email:', signInData.user?.email);
    console.log('   Token gerado com sucesso!');
  }
  
  // 4. Verificar outros avaliadores para comparação
  console.log('\n4️⃣  VERIFICANDO OUTROS AVALIADORES...\n');
  
  const { data: evaluators } = await supabase
    .from('teams')
    .select('name, email, role')
    .eq('role', 'evaluator')
    .order('name');
  
  if (evaluators && evaluators.length > 0) {
    console.log('📋 Avaliadores cadastrados:');
    evaluators.forEach((ev, i) => {
      console.log(`   ${i + 1}. ${ev.name} - ${ev.email}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DIAGNÓSTICO COMPLETO\n');
  
  // Diagnóstico final
  const userExistsInAuth = authUsers?.users.some(u => u.email === 'camile.souza@startcup-amf.com');
  const userExistsInTeams = teamData !== null;
  const loginWorks = !signInError;
  
  if (!userExistsInAuth && !userExistsInTeams) {
    console.log('❌ PROBLEMA: Usuário não existe em lugar nenhum!');
    console.log('✅ SOLUÇÃO: Executar script de criação de usuário.');
  } else if (!userExistsInAuth && userExistsInTeams) {
    console.log('❌ PROBLEMA: Existe na tabela teams mas não no auth!');
    console.log('✅ SOLUÇÃO: Criar usuário no auth.users com a senha CSCEvaluator@2025!');
  } else if (userExistsInAuth && !userExistsInTeams) {
    console.log('❌ PROBLEMA: Existe no auth mas não na tabela teams!');
    console.log('✅ SOLUÇÃO: Cadastrar na tabela teams com role=evaluator.');
  } else if (!loginWorks) {
    console.log('❌ PROBLEMA: Usuário existe mas senha está incorreta!');
    console.log('✅ SOLUÇÃO: Resetar senha para CSCEvaluator@2025!');
  } else {
    console.log('✅ TUDO OK! Login funciona perfeitamente.');
  }
  
  console.log('='.repeat(80) + '\n');
}

checkCamileLogin().catch(console.error);
