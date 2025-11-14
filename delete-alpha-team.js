// ============================================================================
// SCRIPT: Deletar equipe fictícia "alpha"
// ============================================================================
// Este script deleta a equipe alpha e seu usuário do Auth
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deleteAlphaTeam() {
  console.log('🚀 Deletando equipe fictícia "alpha"...\n');

  // PASSO 1: Buscar a equipe alpha na tabela teams
  console.log('⏳ Buscando equipe alpha na tabela teams...\n');
  const { data: teams, error: fetchError } = await supabase
    .from('teams')
    .select('id, email, name')
    .ilike('name', '%alpha%');

  if (fetchError) {
    console.log('❌ Erro ao buscar equipes:', fetchError.message);
    return;
  }

  if (teams.length === 0) {
    console.log('✅ Nenhuma equipe "alpha" encontrada na tabela teams\n');
  } else {
    console.log(`🗑️  Encontradas ${teams.length} equipe(s) com nome "alpha":\n`);
    for (const team of teams) {
      console.log(`   - ${team.name} (${team.email})`);
    }
    console.log('\n⏳ Deletando da tabela teams...\n');

    // Deletar cada equipe alpha encontrada
    for (const team of teams) {
      const { error: deleteTeamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', team.id);

      if (deleteTeamError) {
        console.log(`⚠️  Erro ao deletar ${team.name}: ${deleteTeamError.message}`);
      } else {
        console.log(`✅ Deletada da tabela: ${team.name} (${team.email})`);
      }
    }
  }

  // PASSO 2: Buscar usuários "alpha" no Auth
  console.log('\n⏳ Buscando usuários "alpha" no Auth...\n');
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.log('❌ Erro ao listar usuários:', usersError.message);
    return;
  }

  const alphaUsers = users.users.filter(u =>
    u.email && u.email.toLowerCase().includes('alpha')
  );

  if (alphaUsers.length === 0) {
    console.log('✅ Nenhum usuário "alpha" encontrado no Auth\n');
  } else {
    console.log(`🗑️  Encontrados ${alphaUsers.length} usuário(s) "alpha":\n`);
    for (const user of alphaUsers) {
      console.log(`   - ${user.email}`);
    }
    console.log('\n⏳ Deletando do Auth...\n');

    // Deletar cada usuário alpha
    for (const user of alphaUsers) {
      try {
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
          user.id,
          true // Hard delete
        );

        if (deleteUserError) {
          console.log(`⚠️  Erro ao deletar ${user.email}: ${deleteUserError.message}`);
        } else {
          console.log(`✅ Deletado do Auth: ${user.email}`);
        }
      } catch (err) {
        console.log(`⚠️  Erro ao deletar ${user.email}: ${err.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Limpeza concluída!');
  console.log('='.repeat(70));
  console.log('\n🎉 Equipe alpha foi completamente removida do sistema!');
}

deleteAlphaTeam();
