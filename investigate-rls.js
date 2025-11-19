require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateRLS() {
  console.log('🔍 Investigando policies RLS da tabela quests...\n');
  
  // Tentar obter informações sobre as policies
  const { data: policies, error } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT
          polname AS policy_name,
          polcmd AS policy_command,
          polpermissive AS is_permissive,
          polroles::regrole[] AS roles,
          pg_get_expr(polqual, polrelid) AS using_expression,
          pg_get_expr(polwithcheck, polrelid) AS with_check_expression
        FROM pg_policy
        WHERE polrelid = 'quests'::regclass
        ORDER BY polname;
      `
    });
    
  if (error) {
    console.log('⚠️ Não foi possível executar SQL direto:', error.message);
    console.log('Tentando abordagem alternativa...\n');
    
    // Tentar UPDATE com service_role diretamente
    console.log('🧪 Tentando UPDATE direto com service_role...\n');
    
    const { data: quest, error: selectError } = await supabase
      .from('quests')
      .select('id, order_index, name, status')
      .eq('phase_id', 5)
      .eq('order_index', 3)
      .single();
      
    if (selectError) {
      console.error('❌ Erro ao buscar quest:', selectError);
      return;
    }
    
    console.log(`Quest encontrada: ${quest.name} (ID: ${quest.id})`);
    console.log(`Status atual: ${quest.status}\n`);
    
    // Tentar UPDATE com diferentes abordagens
    console.log('Abordagem 1: UPDATE com .eq()\n');
    const { error: error1 } = await supabase
      .from('quests')
      .update({ status: 'active' })
      .eq('id', quest.id);
    console.log(error1 ? `❌ Erro: ${error1.message}` : '✅ Sucesso');
    
    console.log('\nAbordagem 2: UPDATE com .match()\n');
    const { error: error2 } = await supabase
      .from('quests')
      .update({ status: 'active' })
      .match({ id: quest.id });
    console.log(error2 ? `❌ Erro: ${error2.message}` : '✅ Sucesso');
    
    console.log('\nAbordagem 3: UPDATE múltiplos campos\n');
    const { error: error3 } = await supabase
      .from('quests')
      .update({ 
        status: 'active',
        started_at: new Date().toISOString(),
        started_by: null
      })
      .eq('id', quest.id);
    console.log(error3 ? `❌ Erro: ${error3.message}` : '✅ Sucesso');
    
  } else {
    console.log('✅ Policies encontradas:\n');
    console.log(JSON.stringify(policies, null, 2));
  }
}

investigateRLS().catch(console.error);
