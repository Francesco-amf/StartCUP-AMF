require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findAndFixMissingUsers() {
  console.log('🔍 Buscando Bruna Leao e Michael Silva no Auth...\n');
  
  // Listar todos os usuários
  const { data: allUsers } = await supabase.auth.admin.listUsers();
  
  const bruna = allUsers.users.find(u => u.email === 'bruna.leao@startcup-amf.com');
  const michael = allUsers.users.find(u => u.email === 'michael.silva@startcup-amf.com');
  
  console.log('Bruna Leao:');
  if (bruna) {
    console.log(`  ✅ Encontrada no Auth`);
    console.log(`  ID correto: ${bruna.id}`);
    console.log(`  user_metadata.role: ${bruna.user_metadata?.role}`);
    
    // Atualizar ID na tabela evaluators
    const { error: updateError } = await supabase
      .from('evaluators')
      .update({ id: bruna.id })
      .eq('email', 'bruna.leao@startcup-amf.com');
    
    if (updateError) {
      console.log(`  ❌ Erro ao atualizar ID: ${updateError.message}`);
    } else {
      console.log(`  ✅ ID atualizado na tabela evaluators`);
    }
    
    // Garantir role correto
    await supabase.auth.admin.updateUserById(bruna.id, {
      user_metadata: { full_name: 'Bruna Leao', role: 'evaluator' },
      app_metadata: { provider: 'email', providers: ['email'], role: 'evaluator' }
    });
    console.log(`  ✅ Metadata atualizado`);
    
    // Atualizar role para mentor
    await supabase.from('evaluators').update({ role: 'mentor' }).eq('id', bruna.id);
    console.log(`  ✅ Role definido como 'mentor'\n`);
  } else {
    console.log(`  ❌ NÃO encontrada no Auth\n`);
  }
  
  console.log('Michael Silva:');
  if (michael) {
    console.log(`  ✅ Encontrado no Auth`);
    console.log(`  ID correto: ${michael.id}`);
    console.log(`  user_metadata.role: ${michael.user_metadata?.role}`);
    
    // Atualizar ID na tabela evaluators
    const { error: updateError } = await supabase
      .from('evaluators')
      .update({ id: michael.id })
      .eq('email', 'michael.silva@startcup-amf.com');
    
    if (updateError) {
      console.log(`  ❌ Erro ao atualizar ID: ${updateError.message}`);
    } else {
      console.log(`  ✅ ID atualizado na tabela evaluators`);
    }
    
    // Garantir role correto
    await supabase.auth.admin.updateUserById(michael.id, {
      user_metadata: { full_name: 'Michael Silva', role: 'evaluator' },
      app_metadata: { provider: 'email', providers: ['email'], role: 'evaluator' }
    });
    console.log(`  ✅ Metadata atualizado`);
    
    // Atualizar role para mentor
    await supabase.from('evaluators').update({ role: 'mentor' }).eq('id', michael.id);
    console.log(`  ✅ Role definido como 'mentor'\n`);
  } else {
    console.log(`  ❌ NÃO encontrado no Auth\n`);
  }
  
  console.log('='.repeat(80));
  console.log('✅ Correção concluída!\n');
}

findAndFixMissingUsers();
