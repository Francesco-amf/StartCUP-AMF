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
    nome: 'Michael Silva', 
    email: 'michael.silva@startcup-amf.com', 
    senha: 'MSEvaluator@2025!' 
  },
  { 
    nome: 'Bruna Leao', 
    email: 'bruna.leao@startcup-amf.com', 
    senha: 'BLEvaluator@2025!' 
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
        role: 'avaliador'
      }
    });

    if (error) {
      console.error(`❌ Erro: ${error.message}`);
    } else {
      console.log(`✅ Sucesso! ID: ${data.user.id}`);
    }
  }
}

adicionarUsuarios();