// adicionar-usuarios.js
require('dotenv').config({ path: '.env.local' }); // Lê o arquivo .env.local
const { createClient } = require('@supabase/supabase-js');

// Pega as variáveis direto do arquivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificação de segurança antes de rodar
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERRO: Variáveis não encontradas!');
  console.error('Verifique se NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const usuariosParaAdicionar = [
  { 
    nome: 'Jessica Baratto', 
    email: 'jessica.baratto@startcup-amf.com', 
    senha: 'JBEvaluator@2025!' 
  }
];

async function adicionarUsuarios() {
  console.log('🚀 Lendo .env.local e iniciando...');

  for (const usuario of usuariosParaAdicionar) {
    console.log(`Criando usuário: ${usuario.nome}...`);

    const { data, error } = await supabase.auth.admin.createUser({
      email: usuario.email,
      password: usuario.senha,
      email_confirm: true,
      user_metadata: { 
        full_name: usuario.nome,
        role: 'evaluator'
      },
      app_metadata: {
        provider: 'email',
        providers: ['email'],
        role: 'evaluator'
      }
    });

    if (error) {
      console.error(`❌ Erro: ${error.message}`);
    } else {
      console.log(`✅ Sucesso! ID: ${data.user.id}`);
      
      // Adicionar na tabela evaluators
      const { error: evalError } = await supabase
        .from('evaluators')
        .insert({
          id: data.user.id,
          name: usuario.nome,
          email: usuario.email,
          specialty: 'Avaliadora',
          is_online: false,
          role: 'evaluator'
        });
      
      if (evalError) {
        console.error(`❌ Erro ao adicionar na tabela evaluators: ${evalError.message}`);
      } else {
        console.log(`✅ Adicionada na tabela evaluators!`);
      }
    }
  }
}

adicionarUsuarios();