require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const evaluatorsToFix = [
  {
    name: 'Jessica Baratto',
    email: 'jessica.baratto@startcup-amf.com',
    password: 'JBEvaluator@2025!',
    id: 'c7512b27-7639-4808-92d8-064e9ea660f1' // já existe
  },
  {
    name: 'Bruna Leao',
    email: 'bruna.leao@startcup-amf.com',
    password: 'BLEvaluator@2025!',
    id: '1091e2d7-7c9c-4ad5-bd46-90db4eef5ee8' // existe na tabela, falta no Auth
  },
  {
    name: 'Michael Silva',
    email: 'michael.silva@startcup-amf.com',
    password: 'MSEvaluator@2025!',
    id: '84d8f2e9-70b9-48e5-ad45-0c25965a7088' // existe na tabela, falta no Auth
  }
];

async function fixAllEvaluators() {
  console.log('🔧 CORRIGINDO AVALIADORES...\n');
  console.log('='.repeat(80));
  
  for (const evaluator of evaluatorsToFix) {
    console.log(`\n📝 Processando: ${evaluator.name}`);
    console.log(`   Email: ${evaluator.email}`);
    
    // 1. Verificar se usuário existe no Auth
    const { data: existingUser } = await supabase.auth.admin.getUserById(evaluator.id);
    
    if (!existingUser.user) {
      // Usuário não existe no Auth, criar
      console.log('   ⚠️  Usuário não existe no Auth, criando...');
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: evaluator.email,
        password: evaluator.password,
        email_confirm: true,
        user_metadata: {
          full_name: evaluator.name,
          role: 'evaluator'
        },
        app_metadata: {
          provider: 'email',
          providers: ['email'],
          role: 'evaluator'
        }
      });
      
      if (createError) {
        console.log(`   ❌ Erro ao criar usuário: ${createError.message}`);
        continue;
      }
      
      console.log(`   ✅ Usuário criado no Auth (ID: ${newUser.user.id})`);
      
      // Atualizar ID na tabela evaluators se foi gerado um novo
      if (newUser.user.id !== evaluator.id) {
        const { error: updateIdError } = await supabase
          .from('evaluators')
          .update({ id: newUser.user.id })
          .eq('id', evaluator.id);
        
        if (updateIdError) {
          console.log(`   ⚠️  Aviso: não foi possível atualizar ID na tabela`);
        } else {
          evaluator.id = newUser.user.id; // atualizar para próximas operações
        }
      }
    } else {
      console.log('   ✅ Usuário já existe no Auth');
      
      // Atualizar metadata para garantir que está correto
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        evaluator.id,
        {
          user_metadata: {
            full_name: evaluator.name,
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
        console.log(`   ⚠️  Erro ao atualizar metadata: ${updateError.message}`);
      } else {
        console.log('   ✅ Metadata atualizado');
      }
    }
    
    // 2. Atualizar/criar registro na tabela evaluators com role='mentor'
    console.log('   📝 Atualizando tabela evaluators...');
    
    const { error: evalError } = await supabase
      .from('evaluators')
      .upsert({
        id: evaluator.id,
        name: evaluator.name,
        email: evaluator.email,
        specialty: evaluator.name.includes('Bruna') ? 'Avaliadora' : 
                   evaluator.name.includes('Jessica') ? 'Avaliadora' : 'Avaliador',
        is_online: false,
        role: 'mentor' // ✅ MENTOR para poder dar mentoria
      });
    
    if (evalError) {
      console.log(`   ❌ Erro ao atualizar evaluators: ${evalError.message}`);
    } else {
      console.log('   ✅ Tabela evaluators atualizada (role: mentor)');
    }
  }
  
  // 3. Verificação final
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFICAÇÃO FINAL:\n');
  
  for (const evaluator of evaluatorsToFix) {
    const { data: user } = await supabase.auth.admin.getUserById(evaluator.id);
    const { data: eval_record } = await supabase
      .from('evaluators')
      .select('*')
      .eq('email', evaluator.email)
      .single();
    
    console.log(`${evaluator.name}:`);
    console.log(`  Auth user_metadata.role: ${user.user?.user_metadata?.role}`);
    console.log(`  Auth app_metadata.role: ${user.user?.app_metadata?.role}`);
    console.log(`  Evaluators table role: ${eval_record?.role}`);
    console.log(`  Status: ${user.user && eval_record?.role === 'mentor' ? '✅ OK - Pode avaliar e dar mentoria' : '❌ Problema'}\n`);
  }
  
  console.log('='.repeat(80));
  console.log('✅ CONCLUÍDO!\n');
}

fixAllEvaluators();
