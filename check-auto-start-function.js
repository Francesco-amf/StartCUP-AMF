require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAutoStartFunction() {
  console.log('🔍 VERIFICANDO FUNÇÃO auto_start_next_quest()\n');
  console.log('='.repeat(80));
  
  // Tentar obter definição da função
  const { data, error } = await supabase.rpc('get_function_definition', {
    p_schema: 'public',
    p_function: 'auto_start_next_quest'
  }).catch(() => ({ data: null, error: 'RPC não disponível' }));
  
  if (error || !data) {
    console.log('⚠️  Não foi possível obter definição via RPC');
    console.log('Verificando via tabela do schema...\n');
    
    // Verificar se função existe e tem a validação de BOSS
    console.log('💡 A função auto_start_next_quest() deveria:');
    console.log('   1. Verificar se próxima quest é BOSS (deliverable_type = "presentation")');
    console.log('   2. Se for BOSS, NÃO ativar automaticamente');
    console.log('   3. Retornar com mensagem: "Aguardando ativação manual"');
    console.log('\n📋 Para diagnosticar o problema:');
    console.log('   1. Acesse: Supabase Dashboard → SQL Editor');
    console.log('   2. Execute:');
    console.log(`
DROP FUNCTION IF EXISTS public.get_function_definition(text, text);
CREATE OR REPLACE FUNCTION public.get_function_definition(p_schema TEXT, p_function TEXT)
RETURNS text AS $$
BEGIN
  RETURN (SELECT pg_get_functiondef(oid) 
          FROM pg_proc 
          WHERE proname = p_function AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = p_schema));
END;
$$ LANGUAGE plpgsql;

SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'auto_start_next_quest' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    `);
  } else {
    console.log('✅ Função encontrada');
    console.log('Definição:');
    console.log(data);
    
    if (data.includes('presentation') && data.includes('v_is_boss')) {
      console.log('\n✅ Função HAS boss validation!');
    } else {
      console.log('\n❌ Função MISSING boss validation!');
      console.log('   A função não está impedindo ativação automática de BOSS!');
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

checkAutoStartFunction().catch(console.error);
