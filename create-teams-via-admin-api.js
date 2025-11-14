// ============================================================================
// SCRIPT: Criar usuários via Supabase Admin API (FUNCIONA CORRETAMENTE)
// ============================================================================
// Este script cria usuários de forma CORRETA usando a API Admin do Supabase
// Isto garante que o provider está registrado corretamente
//
// COMO USAR:
// 1. Instale dependências: npm install @supabase/supabase-js
// 2. Execute: node create-teams-via-admin-api.js
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

// Configurar com seu Service Role Key (não a Anon Key!)
const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const teams = [
  { email: 'visionone@startcup-amf.com', password: 'VisionOne@2024!', name: 'VisionOne' },
  { email: 'codigosentencial@startcup-amf.com', password: 'CodigoSentencial@2024!', name: 'Código Sentencial (CS)' },
  { email: 'smartcampus@startcup-amf.com', password: 'Smartcampus@2024!', name: 'Smartcampus' },
  { email: 'geracaof@startcup-amf.com', password: 'GeracaoF@2024!', name: 'Geração F' },
  { email: 'sparkup@startcup-amf.com', password: 'SparkUp@2024!', name: 'SparkUp' },
  { email: 'mistoscom@startcup-amf.com', password: 'Mistos.com@2024!', name: 'Mistos.com' },
  { email: 'cogniverse@startcup-amf.com', password: 'Cogniverse@2024!', name: 'Cogniverse' },
  { email: 'osnotaveis@startcup-amf.com', password: 'OsNotaveis@2024!', name: 'Os Notáveis' },
  { email: 'turistando@startcup-amf.com', password: 'Turistando@2024!', name: 'Turistando' },
  { email: 'sym@startcup-amf.com', password: 'S.Y.M.@2024!', name: 'S.Y.M.' },
  { email: 'gastroproject@startcup-amf.com', password: 'Gastroproject@2024!', name: 'Gastroproject' },
  { email: 'mova@startcup-amf.com', password: 'MOVA@2024!', name: 'MOVA' },
  { email: 'aureaforma@startcup-amf.com', password: 'AureaForma@2024!', name: 'Áurea Forma' },
  { email: 'lumus@startcup-amf.com', password: 'Lumus@2024!', name: 'Lumus' },
  { email: 'mosaico@startcup-amf.com', password: 'Mosaico@2024!', name: 'Mosaico' },
];

async function createTeams() {
  console.log('🚀 Iniciando criação de equipes via Admin API...\n');

  let successCount = 0;
  let errorCount = 0;

  // PASSO 1: Primeiro, deletar usuarios antigos
  console.log('🗑️  Deletando usuários antigos (.local)...');
  const { error: deleteError } = await supabase
    .from('teams')
    .delete()
    .like('email', '%@startcup.local');

  if (deleteError) {
    console.log('⚠️  Erro ao deletar times antigos:', deleteError);
  }

  // PASSO 2: Criar cada usuário
  for (const team of teams) {
    try {
      console.log(`⏳ Criando usuário: ${team.email}...`);

      // Criar usuário via Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: team.email,
        password: team.password,
        email_confirm: true, // Confirma automaticamente
        user_metadata: {
          role: 'team',
        },
        app_metadata: {
          provider: 'email',
          providers: ['email'],
          role: 'team',
        },
      });

      if (error) {
        console.log(`❌ Erro ao criar ${team.email}:`, error.message);
        errorCount++;
        continue;
      }

      console.log(`✅ Usuário criado: ${team.email}`);

      // PASSO 3: Criar registro na tabela teams
      const { error: teamError } = await supabase
        .from('teams')
        .insert([
          {
            email: team.email,
            name: team.name,
            course: 'StartCup 2024',
            members: [],
          },
        ])
        .select();

      if (teamError) {
        console.log(`⚠️  Erro ao criar time no banco: ${team.email}`, teamError);
      } else {
        console.log(`✅ Time registrado: ${team.name}\n`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Erro inesperado para ${team.email}:`, err);
      errorCount++;
    }
  }

  console.log('\n✅ RESUMO:');
  console.log(`✅ Usuários criados com sucesso: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log('\n🎉 Agora tente fazer login!');
}

createTeams();
