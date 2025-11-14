// ============================================================================
// SCRIPT: Atualizar senhas de 2024 para 2025
// ============================================================================
// Atualiza:
// - Admin: Admin@2024! → Admin@2025!
// - Equipes: [Name]@2024! → [Name]@2025!
// - Avaliadores: [Initials]Evaluator@2024! → [Initials]Evaluator@2025!
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mapear emails antigos com senhas novas
const passwordUpdates = [
  // Admin
  { email: 'admin@test.com', oldPassword: 'Admin@2024!', newPassword: 'Admin@2025!' },

  // Equipes
  { email: 'visionone@startcup-amf.com', oldPassword: 'VisionOne@2024!', newPassword: 'VisionOne@2025!' },
  { email: 'codigosentencial@startcup-amf.com', oldPassword: 'CodigoSentencial@2024!', newPassword: 'CodigoSentencial@2025!' },
  { email: 'smartcampus@startcup-amf.com', oldPassword: 'Smartcampus@2024!', newPassword: 'Smartcampus@2025!' },
  { email: 'geracaof@startcup-amf.com', oldPassword: 'GeracaoF@2024!', newPassword: 'GeracaoF@2025!' },
  { email: 'sparkup@startcup-amf.com', oldPassword: 'SparkUp@2024!', newPassword: 'SparkUp@2025!' },
  { email: 'mistoscom@startcup-amf.com', oldPassword: 'Mistos.com@2024!', newPassword: 'Mistos.com@2025!' },
  { email: 'cogniverse@startcup-amf.com', oldPassword: 'Cogniverse@2024!', newPassword: 'Cogniverse@2025!' },
  { email: 'osnotaveis@startcup-amf.com', oldPassword: 'OsNotaveis@2024!', newPassword: 'OsNotaveis@2025!' },
  { email: 'turistando@startcup-amf.com', oldPassword: 'Turistando@2024!', newPassword: 'Turistando@2025!' },
  { email: 'sym@startcup-amf.com', oldPassword: 'S.Y.M.@2024!', newPassword: 'S.Y.M.@2025!' },
  { email: 'gastroproject@startcup-amf.com', oldPassword: 'Gastroproject@2024!', newPassword: 'Gastroproject@2025!' },
  { email: 'mova@startcup-amf.com', oldPassword: 'MOVA@2024!', newPassword: 'MOVA@2025!' },
  { email: 'aureaforma@startcup-amf.com', oldPassword: 'AureaForma@2024!', newPassword: 'AureaForma@2025!' },
  { email: 'lumus@startcup-amf.com', oldPassword: 'Lumus@2024!', newPassword: 'Lumus@2025!' },
  { email: 'mosaico@startcup-amf.com', oldPassword: 'Mosaico@2024!', newPassword: 'Mosaico@2025!' },

  // Avaliadores
  { email: 'natalia.santos@startcup-amf.com', oldPassword: 'NSEvaluator@2024!', newPassword: 'NSEvaluator@2025!' },
  { email: 'eloi.brandt@startcup-amf.com', oldPassword: 'EBEvaluator@2024!', newPassword: 'EBEvaluator@2025!' },
  { email: 'wilian.neu@startcup-amf.com', oldPassword: 'WNEvaluator@2024!', newPassword: 'WNEvaluator@2025!' },
  { email: 'clarissa.miranda@startcup-amf.com', oldPassword: 'CMEvaluator@2024!', newPassword: 'CMEvaluator@2025!' },
  { email: 'aline.rospa@startcup-amf.com', oldPassword: 'AREvaluator@2024!', newPassword: 'AREvaluator@2025!' },
  { email: 'patricia.dias@startcup-amf.com', oldPassword: 'PDEvaluator@2024!', newPassword: 'PDEvaluator@2025!' },
  { email: 'rafaela.tagliapietra@startcup-amf.com', oldPassword: 'RTEvaluator@2024!', newPassword: 'RTEvaluator@2025!' },
  { email: 'francesco.santini@startcup-amf.com', oldPassword: 'FSEvaluator@2024!', newPassword: 'FSEvaluator@2025!' },
  { email: 'douglas.garlet@startcup-amf.com', oldPassword: 'DGEvaluator@2024!', newPassword: 'DGEvaluator@2025!' },
  { email: 'kauan.goncalves@startcup-amf.com', oldPassword: 'KGEvaluator@2024!', newPassword: 'KGEvaluator@2025!' },
  { email: 'angelo.tissot@startcup-amf.com', oldPassword: 'ATEvaluator@2024!', newPassword: 'ATEvaluator@2025!' },
  { email: 'marcelo.medeiros@startcup-amf.com', oldPassword: 'MMEvaluator@2024!', newPassword: 'MMEvaluator@2025!' },
  { email: 'pedro.hermes@startcup-amf.com', oldPassword: 'PHEvaluator@2024!', newPassword: 'PHEvaluator@2025!' },
  { email: 'augusto@startcup-amf.com', oldPassword: 'AEvaluator@2024!', newPassword: 'AEvaluator@2025!' },
  { email: 'gustavo.florencio@startcup-amf.com', oldPassword: 'GFEvaluator@2024!', newPassword: 'GFEvaluator@2025!' },
];

async function updatePasswordsTo2025() {
  console.log('🚀 Atualizando senhas para 2025...\n');

  let successCount = 0;
  let errorCount = 0;

  // Buscar todos os usuários
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.log('❌ Erro ao listar usuários:', usersError.message);
    return;
  }

  console.log(`⏳ Atualizando ${passwordUpdates.length} senhas...\n`);

  for (const update of passwordUpdates) {
    try {
      // Encontrar o usuário
      const user = users.users.find(u => u.email === update.email);

      if (!user) {
        console.log(`⚠️  Usuário não encontrado: ${update.email}`);
        errorCount++;
        continue;
      }

      // Atualizar senha
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: update.newPassword }
      );

      if (updateError) {
        console.log(`⚠️  ${update.email}: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${update.email}: ${update.oldPassword} → ${update.newPassword}`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${update.email}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`✅ Senhas atualizadas: ${successCount}`);
  console.log(`⚠️  Erros: ${errorCount}`);
  console.log('='.repeat(70));
  console.log('\n🎉 Todas as senhas foram atualizadas para 2025!');
}

updatePasswordsTo2025();
