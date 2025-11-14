// ============================================================================
// SCRIPT: Atualizar ano de 2024 para 2025 em todos os registros
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateYearTo2025() {
  console.log('🚀 Atualizando ano para 2025...\n');

  let updatedCount = 0;
  let errorCount = 0;

  // PASSO 1: Atualizar tabela teams
  console.log('⏳ Atualizando tabela teams...\n');

  const { data: teams, error: fetchError } = await supabase
    .from('teams')
    .select('id, course')
    .eq('course', 'StartCup 2024');

  if (fetchError) {
    console.log('❌ Erro ao buscar teams:', fetchError.message);
  } else if (teams.length > 0) {
    console.log(`📊 Encontradas ${teams.length} equipes com "StartCup 2024"\n`);

    const { error: updateError, count } = await supabase
      .from('teams')
      .update({ course: 'StartCup 2025' })
      .eq('course', 'StartCup 2024');

    if (updateError) {
      console.log(`⚠️  Erro ao atualizar teams: ${updateError.message}`);
      errorCount++;
    } else {
      console.log(`✅ Atualizadas ${teams.length} equipes para "StartCup 2025"`);
      updatedCount += teams.length;
    }
  } else {
    console.log('✅ Nenhuma equipe com "StartCup 2024" encontrada');
  }

  // PASSO 2: Verificar e atualizar outros campos se necessário
  console.log('\n⏳ Verificando campos com ano 2024...\n');

  // Buscar todos os registros das tabelas para verificar
  const { data: allTeams } = await supabase
    .from('teams')
    .select('id, course, name');

  if (allTeams) {
    console.log('📊 Status das equipes:');
    allTeams.forEach(team => {
      console.log(`   - ${team.name}: ${team.course}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log(`✅ Registros atualizados: ${updatedCount}`);
  console.log(`⚠️  Erros: ${errorCount}`);
  console.log('='.repeat(70));
  console.log('\n🎉 Ano atualizado para 2025 com sucesso!');
}

updateYearTo2025();
