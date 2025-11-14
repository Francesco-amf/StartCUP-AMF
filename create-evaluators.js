// ============================================================================
// SCRIPT: Criar 15 Avaliadores/Mentores via Admin API
// ============================================================================
// Este script cria 15 avaliadores reais usando a API Admin do Supabase
// Com credenciais geradas automaticamente
//
// COMO USAR:
// 1. Execute: node create-evaluators.js
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

// Configurar com seu Service Role Key
const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Lista de avaliadores reais
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

// Remover acentos de um string
function removeAccents(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Gerar senha segura baseada no nome (SEM ACENTOS)
function generatePassword(name) {
  // Remover acentos do nome
  const nameWithoutAccents = removeAccents(name);
  // Pega primeira letra do primeiro nome + primeira letra do segundo nome + @2024!
  const parts = nameWithoutAccents.split(' ');
  const initials = parts.map(p => p.charAt(0).toUpperCase()).join('');
  return `${initials}Evaluator@2024!`;
}

async function createEvaluators() {
  console.log('🚀 Iniciando criação de 15 avaliadores via Admin API...\n');

  let successCount = 0;
  let errorCount = 0;

  // Primeiro, deletar avaliador fictício de teste (avaliador1@test.com)
  console.log('🗑️  Deletando avaliador de teste fictício...\n');

  // PASSO 1: Criar cada avaliador
  for (const evaluator of evaluators) {
    const password = generatePassword(evaluator.name);

    try {
      console.log(`⏳ Criando avaliador: ${evaluator.name} (${evaluator.email})...`);

      // Criar usuário via Admin API
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
        console.log(`❌ Erro ao criar ${evaluator.email}:`, error.message);
        errorCount++;
        continue;
      }

      console.log(`✅ Avaliador criado: ${evaluator.name}`);
      console.log(`   Email: ${evaluator.email}`);
      console.log(`   Senha: ${password}\n`);

      successCount++;
    } catch (err) {
      console.log(`❌ Erro inesperado para ${evaluator.email}:`, err);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ RESUMO:');
  console.log(`✅ Avaliadores criados com sucesso: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log('='.repeat(70));

  // Mostrar credenciais para copiar
  console.log('\n📋 CREDENCIAIS DOS 15 AVALIADORES:\n');
  console.log('| Nome | Email | Senha |');
  console.log('|------|-------|-------|');

  for (const evaluator of evaluators) {
    const password = generatePassword(evaluator.name);
    console.log(
      `| ${evaluator.name} | ${evaluator.email} | ${password} |`
    );
  }

  console.log('\n🎉 Pronto! Agora tente fazer login como avaliador!');
  console.log('💡 Dica: Guarde estas credenciais em um lugar seguro (Google Sheets, etc)');
}

createEvaluators();
