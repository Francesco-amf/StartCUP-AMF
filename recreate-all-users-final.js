// ============================================================================
// SCRIPT FINAL: Recriar TODOS os usuários (Teams + Evaluators + Admin)
// ============================================================================
// Este script recria:
// - 1 Admin
// - 15 Teams
// - 15 Evaluators
//
// COMO USAR:
// 1. Restaure o backup no Supabase primeiro!
// 2. Execute: node recreate-all-users-final.js
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

// Configurar com seu Service Role Key
const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Remover acentos
function removeAccents(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Gerar senha para evaluators
function generateEvaluatorPassword(name) {
  const nameWithoutAccents = removeAccents(name);
  const parts = nameWithoutAccents.split(' ');
  const initials = parts.map(p => p.charAt(0).toUpperCase()).join('');
  return `${initials}Evaluator@2024!`;
}

// Lista de Teams
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

// Lista de Evaluators
const evaluators = [
  { name: 'Natália Santos', email: 'natalia.santos@startcup-amf.com' },
  { name: 'Eloi Brandt', email: 'eloi.brandt@startcup-amf.com' },
  { name: 'Wilian Neu', email: 'wilian.neu@startcup-amf.com' },
  { name: 'Clarissa Miranda', email: 'clarissa.miranda@startcup-amf.com' },
  { name: 'Aline Rospa', email: 'aline.rospa@startcup-amf.com' },
  { name: 'Patrícia Dias', email: 'patricia.dias@startcup-amf.com' },
  { name: 'Rafaela Tagliapietra', email: 'rafaela.tagliapietra@startcup-amf.com' },
  { name: 'Francesco Santini', email: 'francesco.santini@startcup-amf.com' },
  { name: 'Douglas Garlet', email: 'douglas.garlet@startcup-amf.com' },
  { name: 'Kauan Gonçalves', email: 'kauan.goncalves@startcup-amf.com' },
  { name: 'Ângelo Tissot', email: 'angelo.tissot@startcup-amf.com' },
  { name: 'Marcelo Medeiros', email: 'marcelo.medeiros@startcup-amf.com' },
  { name: 'Pedro Hermes', email: 'pedro.hermes@startcup-amf.com' },
  { name: 'Augusto', email: 'augusto@startcup-amf.com' },
  { name: 'Gustavo Florêncio', email: 'gustavo.florencio@startcup-amf.com' },
];

async function recreateAllUsers() {
  console.log('🚀 Recriando TODOS os usuários...\n');

  let successCount = 0;
  let errorCount = 0;

  // PASSO 1: Criar Admin
  console.log('⏳ Criando Admin...');
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'Admin@2024!',
      email_confirm: true,
      user_metadata: { role: 'admin' },
      app_metadata: {
        provider: 'email',
        providers: ['email'],
        role: 'admin',
      },
    });

    if (!error) {
      console.log('✅ Admin criado: admin@test.com\n');
      successCount++;
    } else {
      console.log('⚠️  Admin já existe ou erro:', error.message, '\n');
    }
  } catch (err) {
    console.log('⚠️  Erro ao criar admin:', err.message, '\n');
  }

  // PASSO 2: Criar Teams
  console.log('⏳ Criando 15 Teams...\n');
  for (const team of teams) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: team.email,
        password: team.password,
        email_confirm: true,
        user_metadata: { role: 'team' },
        app_metadata: {
          provider: 'email',
          providers: ['email'],
          role: 'team',
        },
      });

      if (error) {
        console.log(`⚠️  ${team.email}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${team.name}`);

        // Criar registro na tabela teams
        await supabase.from('teams').insert({
          email: team.email,
          name: team.name,
          course: 'StartCup 2024',
          members: [],
        });

        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${team.email}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n⏳ Criando 15 Avaliadores...\n');
  for (const evaluator of evaluators) {
    const password = generateEvaluatorPassword(evaluator.name);

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: evaluator.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          role: 'evaluator',
          full_name: evaluator.name,
        },
        app_metadata: {
          provider: 'email',
          providers: ['email'],
          role: 'evaluator',
        },
      });

      if (error) {
        console.log(`⚠️  ${evaluator.email}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${evaluator.name} - ${password}`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${evaluator.email}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`✅ Usuários criados: ${successCount}`);
  console.log(`⚠️  Erros: ${errorCount}`);
  console.log('='.repeat(70));
  console.log('\n🎉 Sistema pronto para usar!');
}

recreateAllUsers();
