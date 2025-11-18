// trocar-equipe.js
const { createClient } = require('@supabase/supabase-js');

// --- 1. SUAS CHAVES (Cole aqui igual ao anterior) ---
const supabaseUrl = "https://scmyfwhhjwlmsoobqjyk.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c";
// ----------------------------------------------------

// --- 2. DADOS DA TROCA ---
// Qual era o email do Mosaico? (Precisamos dele para achar e matar o registro antigo)
const emailAntigo = 'mosaico@startcup-amf.com'; // <--- CONFIRA SE É ESSE MESMO

// Dados da nova equipe Outsiders
const novoUsuario = {
  email: 'outsiders@startcup-amf.com',  // <--- Email novo
  senha: 'Outsiders@9930!',             // <--- Senha nova
  nome: 'Outsiders'                     // <--- Nome de exibição
};
// ----------------------------------------------------

if (supabaseUrl.includes("COLE_SUA")) {
    console.error("❌ Erro: Cole suas chaves URL e SERVICE ROLE no início do arquivo.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function realizarTroca() {
  console.log('🔄 Iniciando operação de troca...');

  // PASSO 1: Tentar achar o usuário antigo pelo email para pegar o ID
  // O Supabase não tem "deleteByEmail", precisa do ID.
  console.log(`\n🔎 Procurando usuário antigo: ${emailAntigo}...`);
  
  // Listamos usuários para tentar achar esse email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Erro ao listar usuários:', listError.message);
    return;
  }

  const usuarioAntigoEncontrado = users.find(u => u.email === emailAntigo);

  if (usuarioAntigoEncontrado) {
    console.log(`   Encontrado! ID: ${usuarioAntigoEncontrado.id}`);
    console.log(`🗑️ Deletando Mosaico...`);
    
    const { error: deleteError } = await supabase.auth.admin.deleteUser(usuarioAntigoEncontrado.id);
    
    if (deleteError) console.error(`   Erro ao deletar: ${deleteError.message}`);
    else console.log(`   ✅ Usuário antigo removido com sucesso.`);
    
  } else {
    console.log(`   ⚠️ Usuário antigo não encontrado na lista Auth. Talvez já tenha sido excluído.`);
    console.log(`   Seguindo para criação do novo...`);
  }

  // PASSO 2: Criar o Outsiders
  console.log(`\n🆕 Criando equipe: ${novoUsuario.nome} (${novoUsuario.email})...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: novoUsuario.email,
    password: novoUsuario.senha,
    email_confirm: true,
    user_metadata: {
      full_name: novoUsuario.nome,
      role: 'equipe' // Suponho que seja 'equipe' ou 'user'
    }
  });

  if (error) {
    console.error(`❌ ERRO ao criar: ${error.message}`);
    console.log("DICA: Se o erro for 'Database error', pode ter sobrado lixo na tabela 'profiles' ou 'users' pública.");
  } else {
    console.log(`✅ SUCESSO! Outsiders criado.`);
    console.log(`   ID: ${data.user.id}`);
  }
}

realizarTroca();