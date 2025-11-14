// ============================================================================
// SCRIPT: Limpar avaliadores fictícios/duplicados mantendo apenas os 15 reais
// ============================================================================
// Este script deleta APENAS os avaliadores fictícios do período de testes
// Mantém os 15 avaliadores oficiais:
// - Natália Santos, Eloi Brandt, Wilian Neu, Clarissa Miranda, Aline Rospa
// - Patrícia Dias, Rafaela Tagliapietra, Francesco Santini, Douglas Garlet
// - Kauan Gonçalves, Ângelo Tissot, Marcelo Medeiros, Pedro Hermes
// - Augusto, Gustavo Florêncio
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Os 15 avaliadores REAIS que queremos manter
const realEvaluators = [
  'natalia.santos@startcup-amf.com',
  'eloi.brandt@startcup-amf.com',
  'wilian.neu@startcup-amf.com',
  'clarissa.miranda@startcup-amf.com',
  'aline.rospa@startcup-amf.com',
  'patricia.dias@startcup-amf.com',
  'rafaela.tagliapietra@startcup-amf.com',
  'francesco.santini@startcup-amf.com',
  'douglas.garlet@startcup-amf.com',
  'kauan.goncalves@startcup-amf.com',
  'angelo.tissot@startcup-amf.com',
  'marcelo.medeiros@startcup-amf.com',
  'pedro.hermes@startcup-amf.com',
  'augusto@startcup-amf.com',
  'gustavo.florencio@startcup-amf.com',
];

async function cleanupFakeEvaluators() {
  console.log('🚀 Limpando avaliadores fictícios...\n');

  // PASSO 1: Buscar todos os avaliadores
  console.log('⏳ Buscando todos os avaliadores no banco de dados...\n');
  const { data: allEvaluators, error: fetchError } = await supabase
    .from('evaluators')
    .select('id, email, name, role');

  if (fetchError) {
    console.log('❌ Erro ao buscar avaliadores:', fetchError.message);
    return;
  }

  console.log(`📊 Total de avaliadores encontrados: ${allEvaluators.length}\n`);

  // PASSO 2: Identificar avaliadores fictícios (que não estão na lista de 15 reais)
  const fakeEvaluators = allEvaluators.filter(
    evaluator => !realEvaluators.includes(evaluator.email)
  );

  if (fakeEvaluators.length === 0) {
    console.log('✅ Nenhum avaliador fictício encontrado!');
    console.log(`✅ Sistema limpo com ${allEvaluators.length} avaliadores reais\n`);
    return;
  }

  console.log(`🗑️  Encontrados ${fakeEvaluators.length} avaliadores fictícios:\n`);
  fakeEvaluators.forEach(ev => {
    console.log(`   - ${ev.name} (${ev.email})`);
  });
  console.log('\n');

  let deletedCount = 0;
  let errorCount = 0;

  // PASSO 3: Deletar avaliadores fictícios
  console.log('⏳ Deletando avaliadores fictícios...\n');

  for (const evaluator of fakeEvaluators) {
    try {
      // Deletar da tabela evaluators
      const { error: deleteEvalError } = await supabase
        .from('evaluators')
        .delete()
        .eq('id', evaluator.id);

      if (deleteEvalError) {
        console.log(`⚠️  ${evaluator.email}: ${deleteEvalError.message}`);
        errorCount++;
        continue;
      }

      // Deletar do Auth também
      try {
        await supabase.auth.admin.deleteUser(evaluator.id, true);
        console.log(`🗑️  Deletado: ${evaluator.name} (${evaluator.email})`);
        deletedCount++;
      } catch (authErr) {
        // Se já foi deletado do Auth, continua
        console.log(`🗑️  Deletado de tabela: ${evaluator.name} (${evaluator.email})`);
        deletedCount++;
      }
    } catch (err) {
      console.log(`❌ Erro ao deletar ${evaluator.email}: ${err.message}`);
      errorCount++;
    }
  }

  // PASSO 4: Resultado final
  console.log('\n' + '='.repeat(70));
  console.log(`✅ Avaliadores fictícios deletados: ${deletedCount}`);
  console.log(`⚠️  Erros: ${errorCount}`);
  console.log('='.repeat(70));

  // PASSO 5: Mostrar avaliadores restantes
  const { data: remainingEvaluators } = await supabase
    .from('evaluators')
    .select('id, email, name, role')
    .order('name');

  console.log(`\n✅ Avaliadores restantes (${remainingEvaluators.length}):\n`);
  remainingEvaluators.forEach(ev => {
    console.log(`   ✓ ${ev.name} (${ev.email})`);
  });

  console.log('\n🎉 Sistema limpo com sucesso!');
}

cleanupFakeEvaluators();
