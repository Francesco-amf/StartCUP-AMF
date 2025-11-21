require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addCamileToTeams() {
  console.log('📝 ADICIONANDO CAMILE NA TABELA TEAMS\n');
  
  const userId = '6cc7a380-0c66-4189-a793-8ca0c5caa585';
  
  // Primeiro verificar estrutura da tabela teams
  const { data: existingTeams } = await supabase
    .from('teams')
    .select('*')
    .limit(1);
  
  if (existingTeams && existingTeams.length > 0) {
    console.log('📋 Estrutura da tabela teams:');
    console.log(Object.keys(existingTeams[0]));
    console.log('');
  }
  
  // Tentar inserir com campos corretos
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .insert({
      id: userId,
      name: 'Camile Souza Costa',
      email: 'camile.souza@startcup-amf.com',
      role: 'evaluator'
    })
    .select()
    .single();
  
  if (teamError) {
    if (teamError.code === '23505') {
      console.log('⚠️  Usuário já existe, tentando atualizar...');
      
      const { data: updatedTeam, error: updateError } = await supabase
        .from('teams')
        .update({
          name: 'Camile Souza Costa',
          role: 'evaluator'
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Erro ao atualizar:', updateError.message);
      } else {
        console.log('✅ Atualizado com sucesso!');
        console.log(updatedTeam);
      }
    } else {
      console.error('❌ Erro:', teamError.message);
      console.error('Código:', teamError.code);
      console.error('Details:', teamError.details);
    }
  } else {
    console.log('✅ Adicionado com sucesso na tabela teams!');
    console.log(teamData);
  }
  
  // Verificar resultado final
  const { data: finalCheck } = await supabase
    .from('teams')
    .select('*')
    .eq('email', 'camile.souza@startcup-amf.com')
    .single();
  
  if (finalCheck) {
    console.log('\n✅ VERIFICAÇÃO FINAL:');
    console.log('   Nome:', finalCheck.name);
    console.log('   Email:', finalCheck.email);
    console.log('   Role:', finalCheck.role);
    console.log('   ID:', finalCheck.id);
  } else {
    console.log('\n❌ Ainda não está na tabela teams!');
  }
}

addCamileToTeams().catch(console.error);
