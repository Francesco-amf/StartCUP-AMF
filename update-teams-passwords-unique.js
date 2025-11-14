// ============================================================================
// SCRIPT: Gerar senhas únicas para cada equipe
// ============================================================================
// Substitui "2025" por 4 números aleatórios em cada senha de equipe
// Exemplo: VisionOne@2025! → VisionOne@3847!
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Lista de equipes com senhas antigas
const teams = [
  { email: 'visionone@startcup-amf.com', name: 'VisionOne', oldPassword: 'VisionOne@2025!' },
  { email: 'codigosentencial@startcup-amf.com', name: 'Código Sentencial', oldPassword: 'CodigoSentencial@2025!' },
  { email: 'smartcampus@startcup-amf.com', name: 'Smartcampus', oldPassword: 'Smartcampus@2025!' },
  { email: 'geracaof@startcup-amf.com', name: 'Geração F', oldPassword: 'GeracaoF@2025!' },
  { email: 'sparkup@startcup-amf.com', name: 'SparkUp', oldPassword: 'SparkUp@2025!' },
  { email: 'mistoscom@startcup-amf.com', name: 'Mistos.com', oldPassword: 'Mistos.com@2025!' },
  { email: 'cogniverse@startcup-amf.com', name: 'Cogniverse', oldPassword: 'Cogniverse@2025!' },
  { email: 'osnotaveis@startcup-amf.com', name: 'Os Notáveis', oldPassword: 'OsNotaveis@2025!' },
  { email: 'turistando@startcup-amf.com', name: 'Turistando', oldPassword: 'Turistando@2025!' },
  { email: 'sym@startcup-amf.com', name: 'S.Y.M.', oldPassword: 'S.Y.M.@2025!' },
  { email: 'gastroproject@startcup-amf.com', name: 'Gastroproject', oldPassword: 'Gastroproject@2025!' },
  { email: 'mova@startcup-amf.com', name: 'MOVA', oldPassword: 'MOVA@2025!' },
  { email: 'aureaforma@startcup-amf.com', name: 'Áurea Forma', oldPassword: 'AureaForma@2025!' },
  { email: 'lumus@startcup-amf.com', name: 'Lumus', oldPassword: 'Lumus@2025!' },
  { email: 'mosaico@startcup-amf.com', name: 'Mosaico', oldPassword: 'Mosaico@2025!' },
];

// Gerar 4 números aleatórios
function generateRandomNumber() {
  return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

// Gerar senha única substituindo 2025 por números aleatórios
function generateUniquePassword(oldPassword) {
  const randomNumbers = generateRandomNumber();
  return oldPassword.replace('2025', randomNumbers);
}

async function updateTeamPasswordsToUnique() {
  console.log('🚀 Gerando senhas únicas para equipes...\n');

  let successCount = 0;
  let errorCount = 0;
  const passwordLog = [];

  // Buscar todos os usuários
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.log('❌ Erro ao listar usuários:', usersError.message);
    return;
  }

  console.log(`⏳ Atualizando ${teams.length} senhas de equipes...\n`);

  for (const team of teams) {
    try {
      // Encontrar o usuário
      const user = users.users.find(u => u.email === team.email);

      if (!user) {
        console.log(`⚠️  Usuário não encontrado: ${team.email}`);
        errorCount++;
        continue;
      }

      // Gerar nova senha única
      const newPassword = generateUniquePassword(team.oldPassword);

      // Atualizar senha
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.log(`⚠️  ${team.email}: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${team.name}`);
        console.log(`   ${team.oldPassword} → ${newPassword}`);
        passwordLog.push({
          name: team.name,
          email: team.email,
          password: newPassword
        });
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${team.email}: ${err.message}`);
      errorCount++;
    }
  }

  // Mostrar resumo com todas as novas senhas
  console.log('\n' + '='.repeat(70));
  console.log(`✅ Senhas atualizadas: ${successCount}`);
  console.log(`⚠️  Erros: ${errorCount}`);
  console.log('='.repeat(70));

  console.log('\n📋 NOVAS SENHAS DAS EQUIPES:\n');
  passwordLog.forEach(team => {
    console.log(`${team.name}`);
    console.log(`  Email: ${team.email}`);
    console.log(`  Senha: ${team.password}\n`);
  });

  console.log('='.repeat(70));
  console.log('🎉 Senhas únicas geradas com sucesso!');
  console.log('='.repeat(70));
}

updateTeamPasswordsToUnique();
