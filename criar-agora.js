// criar-agora.js
const { createClient } = require('@supabase/supabase-js');

// --- PREENCHA AQUI MANUALMENTE ---
// Vá no Supabase > Settings > API e copie:
const supabaseUrl = "https://scmyfwhhjwlmsoobqjyk.supabase.co"; 
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbXlmd2hoandsbXNvb2JxanlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0NTAwOSwiZXhwIjoyMDc3NDIxMDA5fQ.aSzcF8hbo9j_dJpuQ2joqxa1n4efDCHuEKJHXagkJ3c"; 
// (A chave Service Role começa com eyJ... e geralmente é vermelha/secreta)
// ---------------------------------

// Verificação básica antes de rodar
if (supabaseUrl.includes("COLE_SUA") || supabaseServiceKey.includes("COLE_SUA")) {
    console.error("❌ PARE! Você esqueceu de colar as chaves reais nas linhas 5 e 6 do código.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const usuarios = [
  { nome: 'Michael Silva', email: 'michael.silva@startcup-amf.com', pass: 'MSEvaluator@2025!' },
  { nome: 'Bruna Leao', email: 'bruna.leao@startcup-amf.com', pass: 'BLEvaluator@2025!' }
];

async function executar() {
  console.log("🚀 Iniciando criação via Hardcode...");

  for (const u of usuarios) {
    console.log(`\n👤 Processando: ${u.nome}`);

    // Tenta criar o usuário
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.pass,
      email_confirm: true,
      user_metadata: {
        full_name: u.nome,
        role: 'avaliador'
      }
    });

    if (error) {
      console.error(`❌ FALHA: ${error.message}`);
      // Se der erro de Database, é 100% um Trigger no seu banco.
      // Mas o erro "supabaseUrl is required" não vai acontecer mais.
    } else {
      console.log(`✅ SUCESSO! ID Criado: ${data.user.id}`);
    }
  }
}

executar();