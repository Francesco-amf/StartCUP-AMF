require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumnTypes() {
  console.log('🔍 VERIFICANDO TIPOS DE COLUNAS NO POSTGRES\n');
  console.log('='.repeat(80));
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        table_name,
        column_name,
        data_type,
        datetime_precision
      FROM information_schema.columns
      WHERE table_name IN ('event_config', 'quests')
        AND column_name IN ('event_start_time', 'phase_1_start_time', 'started_at', 'ended_at', 'closed_at')
      ORDER BY table_name, column_name;
    `
  });
  
  if (error) {
    console.log('❌ Não foi possível executar via RPC. Tentando query direta...\n');
    
    // Tentar outra abordagem
    const query = `
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.datetime_precision
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name IN ('event_config', 'quests')
        AND c.column_name LIKE '%time%' OR c.column_name LIKE '%at'
      ORDER BY c.table_name, c.column_name;
    `;
    
    console.log('Query SQL:\n', query);
    console.log('\n⚠️  Execute este SQL manualmente no Supabase SQL Editor');
    console.log('⚠️  Estamos procurando se as colunas são:');
    console.log('   - "timestamp without time zone" (ERRADO - causa bug timezone)');
    console.log('   - "timestamp with time zone" (CORRETO - salva UTC corretamente)');
  } else {
    console.table(data);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('💡 EXPLICAÇÃO:\n');
  console.log('Se as colunas são "timestamp WITHOUT time zone":');
  console.log('  → Postgres IGNORA o timezone e interpreta como local');
  console.log('  → Causa o bug de +3 horas');
  console.log('');
  console.log('Se as colunas são "timestamp WITH time zone" (timestamptz):');
  console.log('  → Postgres CONVERTE e SALVA em UTC corretamente');
  console.log('  → Não tem bug de timezone');
}

checkColumnTypes();
