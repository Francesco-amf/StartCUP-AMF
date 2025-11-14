// ============================================================================
// SCRIPT: Criar registros dos avaliadores na tabela evaluators
// ============================================================================
// Este script cria os registros dos avaliadores no banco de dados
// (os usuários já existem no Auth, mas não estão na tabela evaluators)
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Lista de avaliadores
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
  // 5 novos avaliadores
  { name: 'Camile Souza Costa', email: 'camile.souza@startcup-amf.com' },
  { name: 'Isadora Stangherlin', email: 'isadora.stangherlin@startcup-amf.com' },
  { name: 'Marcelo Diaz', email: 'marcelo.diaz@startcup-amf.com' },
  { name: 'Bruna Pfuller', email: 'bruna.pfuller@startcup-amf.com' },
  { name: 'Ana Balim', email: 'ana.balim@startcup-amf.com' },
];

async function createEvaluatorRecords() {
  console.log('🚀 Criando registros de avaliadores na tabela evaluators...\n');

  let successCount = 0;
  let errorCount = 0;

  // PASSO 1: Limpar registros antigos
  console.log('🗑️  Limpando registros antigos...\n');
  const { error: deleteError } = await supabase
    .from('evaluators')
    .delete()
    .like('email', '%@startcup-amf.com');

  if (deleteError) {
    console.log('⚠️  Erro ao limpar registros antigos:', deleteError.message, '\n');
  } else {
    console.log('✅ Registros antigos removidos\n');
  }

  // PASSO 2: Buscar UUIDs dos usuários do Auth
  console.log('⏳ Buscando UUIDs dos usuários no Auth...\n');
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.log('❌ Erro ao listar usuários:', usersError.message);
    return;
  }

  // PASSO 3: Criar registros na tabela evaluators
  console.log('⏳ Criando registros de avaliadores...\n');

  for (const evaluator of evaluators) {
    try {
      // Encontrar o UUID do usuário
      const user = users.users.find(u => u.email === evaluator.email);

      if (!user) {
        console.log(`⚠️  Usuário não encontrado no Auth: ${evaluator.email}`);
        errorCount++;
        continue;
      }

      // Inserir na tabela evaluators
      const { error: insertError } = await supabase
        .from('evaluators')
        .insert({
          id: user.id,
          email: evaluator.email,
          name: evaluator.name,
          specialty: null,
          is_online: false,
          role: 'evaluator',
        });

      if (insertError) {
        console.log(`⚠️  ${evaluator.email}: ${insertError.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${evaluator.name}`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${evaluator.email}: ${err.message}`);
      errorCount++;
    }
  }

  // PASSO 4: Resultado final
  console.log('\n' + '='.repeat(70));
  console.log(`✅ Registros criados: ${successCount}`);
  console.log(`⚠️  Erros: ${errorCount}`);
  console.log('='.repeat(70));
  console.log('\n🎉 Avaliadores prontos para usar!');
}

createEvaluatorRecords();
