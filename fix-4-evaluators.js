require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const evaluatorsToFix = [
  { name: 'Isadora Stangherlin', email: 'isadora.stangherlin@startcup-amf.com', password: 'ISEvaluator@2025!' },
  { name: 'Marcelo Diaz', email: 'marcelo.diaz@startcup-amf.com', password: 'MDEvaluator@2025!' },
  { name: 'Bruna Pfuller', email: 'bruna.pfuller@startcup-amf.com', password: 'BPEvaluator@2025!' },
  { name: 'Ana Balim', email: 'ana.balim@startcup-amf.com', password: 'ABEvaluator@2025!' }
];

async function fixEvaluatorPasswords() {
  console.log('🔧 CORRIGINDO SENHAS DE 4 AVALIADORES\n');
  console.log('='.repeat(80));
  
  // Obter todos os usuários
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  
  for (let i = 0; i < evaluatorsToFix.length; i++) {
    const evaluator = evaluatorsToFix[i];
    const num = i + 17; // 17, 18, 19, 20
    
    console.log(`\n${num}. Corrigindo ${evaluator.name}...`);
    
    // Encontrar usuário
    const authUser = authUsers.users.find(u => u.email === evaluator.email);
    
    if (!authUser) {
      console.log(`   ❌ Usuário não encontrado no auth!`);
      continue;
    }
    
    console.log(`   ID: ${authUser.id}`);
    
    // Resetar senha
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: evaluator.password }
    );
    
    if (updateError) {
      console.log(`   ❌ Erro ao resetar senha: ${updateError.message}`);
      continue;
    }
    
    console.log(`   ✅ Senha resetada para: ${evaluator.password}`);
    
    // Testar login
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: evaluator.email,
      password: evaluator.password
    });
    
    if (loginError) {
      console.log(`   ❌ Login ainda falha: ${loginError.message}`);
    } else {
      console.log(`   ✅ Login confirmado funcionando!`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 CORREÇÃO COMPLETA!\n');
  console.log('📋 CREDENCIAIS ATUALIZADAS:');
  evaluatorsToFix.forEach((ev, i) => {
    console.log(`   ${i + 17}. ${ev.name}`);
    console.log(`      Email: ${ev.email}`);
    console.log(`      Senha: ${ev.password}\n`);
  });
  console.log('='.repeat(80) + '\n');
}

fixEvaluatorPasswords().catch(console.error);
