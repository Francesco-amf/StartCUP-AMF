require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixCamileAccount() {
  console.log('🔧 CORRIGINDO CONTA DA CAMILE SOUZA COSTA\n');
  console.log('='.repeat(80));
  
  const userEmail = 'camile.souza@startcup-amf.com';
  const newPassword = 'CSCEvaluator@2025!';
  const userId = '6cc7a380-0c66-4189-a793-8ca0c5caa585';
  
  // 1. RESETAR SENHA
  console.log('\n1️⃣  RESETANDO SENHA...\n');
  
  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );
  
  if (updateError) {
    console.error('❌ Erro ao resetar senha:', updateError.message);
  } else {
    console.log('✅ Senha resetada para: CSCEvaluator@2025!');
  }
  
  // 2. CADASTRAR NA TABELA TEAMS
  console.log('\n2️⃣  CADASTRANDO NA TABELA TEAMS...\n');
  
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .insert({
      id: userId, // Usar mesmo ID do auth
      name: 'Camile Souza Costa',
      email: userEmail,
      role: 'evaluator',
      coins: 0,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (teamError) {
    if (teamError.code === '23505') {
      console.log('⚠️  Usuário já existe na tabela teams, atualizando...');
      
      const { data: updatedTeam, error: updateTeamError } = await supabase
        .from('teams')
        .update({
          name: 'Camile Souza Costa',
          role: 'evaluator'
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (updateTeamError) {
        console.error('❌ Erro ao atualizar team:', updateTeamError.message);
      } else {
        console.log('✅ Team atualizado:', updatedTeam.name);
      }
    } else {
      console.error('❌ Erro ao inserir team:', teamError.message);
    }
  } else {
    console.log('✅ Cadastrado na tabela teams:');
    console.log('   ID:', teamData.id);
    console.log('   Nome:', teamData.name);
    console.log('   Email:', teamData.email);
    console.log('   Role:', teamData.role);
  }
  
  // 3. TESTAR LOGIN
  console.log('\n3️⃣  TESTANDO LOGIN...\n');
  
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: newPassword
  });
  
  if (signInError) {
    console.error('❌ AINDA NÃO FUNCIONA:', signInError.message);
  } else {
    console.log('✅ LOGIN FUNCIONOU!');
    console.log('   Email:', signInData.user?.email);
    console.log('   Role:', signInData.user?.user_metadata?.role);
    console.log('   Token gerado com sucesso!');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 CORREÇÃO COMPLETA!\n');
  console.log('📋 CREDENCIAIS:');
  console.log('   Email: camile.souza@startcup-amf.com');
  console.log('   Senha: CSCEvaluator@2025!');
  console.log('   Role: evaluator');
  console.log('='.repeat(80) + '\n');
}

fixCamileAccount().catch(console.error);
