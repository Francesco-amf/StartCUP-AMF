require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkJessica() {
  const { data } = await supabase
    .from('evaluators')
    .select('name, email, role, specialty')
    .eq('email', 'jessica.baratto@startcup-amf.com')
    .single();

  console.log('\n📊 Jessica Baratto:');
  console.log('Role:', data.role);
  console.log('Specialty:', data.specialty);
  
  if (data.role === 'mentor') {
    console.log('\n✅ PODE dar mentoria (aparecerá na lista de mentores)');
  } else {
    console.log('\n❌ NÃO PODE dar mentoria');
    console.log('💡 Para permitir mentoria, role deve ser "mentor" (não "evaluator")');
  }
}

checkJessica();
