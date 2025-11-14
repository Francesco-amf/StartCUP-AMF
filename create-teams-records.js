// ============================================================================
// SCRIPT: Criar registros das equipes na tabela teams
// ============================================================================
// Este script cria os registros das equipes no banco de dados
// (os usuários já existem no Auth, mas não estão na tabela teams)
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scmyfwhhjwlmsoobqjyk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Lista de equipes
const teams = [
  { email: 'visionone@startcup-amf.com', name: 'VisionOne' },
  { email: 'codigosentencial@startcup-amf.com', name: 'Código Sentencial (CS)' },
  { email: 'smartcampus@startcup-amf.com', name: 'Smartcampus' },
  { email: 'geracaof@startcup-amf.com', name: 'Geração F' },
  { email: 'sparkup@startcup-amf.com', name: 'SparkUp' },
  { email: 'mistoscom@startcup-amf.com', name: 'Mistos.com' },
  { email: 'cogniverse@startcup-amf.com', name: 'Cogniverse' },
  { email: 'osnotaveis@startcup-amf.com', name: 'Os Notáveis' },
  { email: 'turistando@startcup-amf.com', name: 'Turistando' },
  { email: 'sym@startcup-amf.com', name: 'S.Y.M.' },
  { email: 'gastroproject@startcup-amf.com', name: 'Gastroproject' },
  { email: 'mova@startcup-amf.com', name: 'MOVA' },
  { email: 'aureaforma@startcup-amf.com', name: 'Áurea Forma' },
  { email: 'lumus@startcup-amf.com', name: 'Lumus' },
  { email: 'mosaico@startcup-amf.com', name: 'Mosaico' },
];

async function createTeamRecords() {
  console.log('🚀 Criando registros de equipes na tabela teams...\n');

  let successCount = 0;
  let errorCount = 0;

  // PASSO 1: Limpar registros antigos
  console.log('🗑️  Limpando registros antigos...\n');
  const { error: deleteError } = await supabase
    .from('teams')
    .delete()
    .like('email', '%@startcup-amf.com');

  if (deleteError) {
    console.log('⚠️  Erro ao limpar registros antigos:', deleteError.message, '\n');
  } else {
    console.log('✅ Registros antigos removidos\n');
  }

  // PASSO 2: Criar registros na tabela teams
  console.log('⏳ Criando registros de equipes...\n');

  for (const team of teams) {
    try {
      const { error: insertError } = await supabase
        .from('teams')
        .insert({
          email: team.email,
          name: team.name,
          course: 'StartCup 2024',
          members: [],
        });

      if (insertError) {
        console.log(`⚠️  ${team.email}: ${insertError.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${team.name}`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${team.email}: ${err.message}`);
      errorCount++;
    }
  }

  // PASSO 3: Resultado final
  console.log('\n' + '='.repeat(70));
  console.log(`✅ Registros criados: ${successCount}`);
  console.log(`⚠️  Erros: ${errorCount}`);
  console.log('='.repeat(70));
  console.log('\n🎉 Equipes prontas para usar!');
}

createTeamRecords();
