require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERRO: Variáveis não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixJessica() {
  console.log('🔧 Corrigindo usuário Jessica Baratto...\n');
  
  const email = 'jessica.baratto@startcup-amf.com';
  const userId = 'c7512b27-7639-4808-92d8-064e9ea660f1';
  
  // 1. Atualizar user_metadata no Auth
  console.log('📝 Atualizando user_metadata...');
  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    userId,
    {
      user_metadata: {
        full_name: 'Jessica Baratto',
        role: 'evaluator'
      },
      app_metadata: {
        provider: 'email',
        providers: ['email'],
        role: 'evaluator'
      }
    }
  );
  
  if (updateError) {
    console.error('❌ Erro ao atualizar metadata:', updateError.message);
  } else {
    console.log('✅ Metadata atualizado com sucesso!');
  }
  
  // 2. Inserir/Atualizar na tabela evaluators
  console.log('\n📝 Atualizando tabela evaluators...');
  const { error: evalError } = await supabase
    .from('evaluators')
    .upsert({
      id: userId,
      name: 'Jessica Baratto',
      email: email,
      specialty: 'Avaliadora',
      is_online: false,
      role: 'evaluator'
    });
  
  if (evalError) {
    console.error('❌ Erro ao atualizar evaluators:', evalError.message);
  } else {
    console.log('✅ Tabela evaluators atualizada!');
  }
  
  // 3. Verificar
  console.log('\n🔍 Verificando configuração final...');
  const { data: user } = await supabase.auth.admin.getUserById(userId);
  const { data: evaluator } = await supabase
    .from('evaluators')
    .select('*')
    .eq('id', userId)
    .single();
  
  console.log('\n📊 Resultado:');
  console.log('Auth user_metadata.role:', user.user?.user_metadata?.role);
  console.log('Auth app_metadata.role:', user.user?.app_metadata?.role);
  console.log('Evaluators table role:', evaluator?.role);
  console.log('\n✅ Pronto! Jessica pode fazer login agora!');
}

fixJessica();
