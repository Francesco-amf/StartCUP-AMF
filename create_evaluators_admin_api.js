#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configurar com seu Service Role Key
const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hvandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const users = [
  {
    email: 'michael.silva@startcup-amf.com',
    password: 'MSEvaluator@2025!',
    name: 'Michael Silva',
    type: 'evaluator',
    specialty: 'Avaliador'
  },
  {
    email: 'bruna.leao@startcup-amf.com',
    password: 'BLEvaluator@2025!',
    name: 'Bruna Leao',
    type: 'evaluator',
    specialty: 'Avaliadora'
  },
  {
    email: 'outsiders@startcup-amf.com',
    password: 'Outsiders@9930!',
    name: 'Outsiders',
    type: 'team',
    specialty: null
  }
];

async function createUsers() {
  console.log('🚀 Iniciando criação de usuários via Admin API...\n');

  let successCount = 0;
  let errorCount = 0;

  // Primeiro, deletar usuarios antigos se existirem
  console.log('🗑️  Limpando registros antigos...');

  // Deletar de auth.users
  try {
    for (const user of users) {
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === user.email)?.id
      ).catch(() => ({ error: null }));
    }
  } catch (err) {
    // Silently fail if users don't exist
  }

  // Criar cada usuário
  for (const user of users) {
    try {
      console.log(`⏳ Criando usuário: ${user.email}...`);

      // Criar usuário via Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Confirma automaticamente
        user_metadata: {
          name: user.name,
          role: user.type,
        },
        app_metadata: {
          provider: 'email',
          providers: ['email'],
          role: user.type,
        },
      });

      if (error) {
        // Se user já existe, tenta só atualizar a senha
        if (error.message.includes('User already exists')) {
          console.log(`⚠️  Usuário já existe: ${user.email}`);
          successCount++;
          continue;
        }
        console.log(`❌ Erro ao criar ${user.email}:`, error.message);
        errorCount++;
        continue;
      }

      console.log(`✅ Usuário criado: ${user.email} (ID: ${data.user.id})`);

      // Se for evaluator, adicionar à tabela de evaluators
      if (user.type === 'evaluator') {
        const { error: evalError } = await supabase
          .from('evaluators')
          .insert([
            {
              id: data.user.id,
              name: user.name,
              email: user.email,
              specialty: user.specialty,
              is_online: false,
              role: 'evaluator',
            },
          ])
          .select();

        if (evalError) {
          console.log(`⚠️  Erro ao adicionar a tabela evaluators:`, evalError.message);
        } else {
          console.log(`✅ Adicionado a tabela evaluators\n`);
          successCount++;
        }
      } else if (user.type === 'team') {
        // Se for team, atualizar/criar na tabela teams
        // Primeiro tenta deletar Mosaico se existir
        const { error: deleteError } = await supabase
          .from('teams')
          .delete()
          .eq('name', 'Mosaico');

        if (deleteError) {
          console.log(`⚠️  Erro ao deletar Mosaico:`, deleteError.message);
        }

        // Agora cria/atualiza para Outsiders
        const { error: teamError } = await supabase
          .from('teams')
          .upsert([
            {
              email: user.email,
              name: user.name,
              course: 'StartCup 2024',
              members: [],
            },
          ])
          .select();

        if (teamError) {
          console.log(`⚠️  Erro ao atualizar time:`, teamError.message);
        } else {
          console.log(`✅ Time ${user.name} atualizado\n`);
          successCount++;
        }
      }
    } catch (err) {
      console.log(`❌ Erro inesperado para ${user.email}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n✅ RESUMO:');
  console.log(`✅ Usuários criados/atualizados com sucesso: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log('\n🎉 Agora tente fazer login com as credenciais!');
  console.log('\nCredenciais:');
  users.forEach(u => {
    console.log(`  ${u.email} / ${u.password}`);
  });
}

createUsers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
