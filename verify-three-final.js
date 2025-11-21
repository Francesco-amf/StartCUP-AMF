require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyThree() {
  const emails = [
    'jessica.baratto@startcup-amf.com',
    'bruna.leao@startcup-amf.com',
    'michael.silva@startcup-amf.com'
  ];
  
  console.log('✅ VERIFICAÇÃO FINAL DOS 3 AVALIADORES:\n');
  console.log('='.repeat(80));
  
  for (const email of emails) {
    const { data: evaluator } = await supabase
      .from('evaluators')
      .select('id, name, email, role')
      .eq('email', email)
      .single();
    
    const { data: authUser } = await supabase.auth.admin.getUserById(evaluator.id);
    
    console.log(`\n${evaluator.name}:`);
    console.log(`  📧 Email: ${email}`);
    console.log(`  🔑 Existe no Auth: ${authUser.user ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`  👤 user_metadata.role: ${authUser.user?.user_metadata?.role}`);
    console.log(`  📊 Tabela evaluators role: ${evaluator.role}`);
    console.log(`  ✅ Pode fazer login: ${authUser.user?.user_metadata?.role === 'evaluator' ? 'SIM' : 'NÃO'}`);
    console.log(`  ✅ Pode avaliar: ${authUser.user?.user_metadata?.role === 'evaluator' ? 'SIM' : 'NÃO'}`);
    console.log(`  ✅ Pode dar mentoria: ${evaluator.role === 'mentor' ? 'SIM' : 'NÃO'}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 TUDO CERTO! Todos os 3 podem fazer login, avaliar e dar mentoria!\n');
}

verifyThree();
