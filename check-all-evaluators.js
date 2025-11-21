require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const evaluatorsList = [
  { name: 'Natália Santos', email: 'natalia.santos@startcup-amf.com', password: 'NSEvaluator@2025!' },
  { name: 'Eloi Brandt', email: 'eloi.brandt@startcup-amf.com', password: 'EBEvaluator@2025!' },
  { name: 'Wilian Neu', email: 'wilian.neu@startcup-amf.com', password: 'WNEvaluator@2025!' },
  { name: 'Clarissa Miranda', email: 'clarissa.miranda@startcup-amf.com', password: 'CMEvaluator@2025!' },
  { name: 'Aline Rospa', email: 'aline.rospa@startcup-amf.com', password: 'AREvaluator@2025!' },
  { name: 'Patrícia Dias', email: 'patricia.dias@startcup-amf.com', password: 'PDEvaluator@2025!' },
  { name: 'Rafaela Tagliapietra', email: 'rafaela.tagliapietra@startcup-amf.com', password: 'RTEvaluator@2025!' },
  { name: 'Francesco Santini', email: 'francesco.santini@startcup-amf.com', password: 'FSEvaluator@2025!' },
  { name: 'Douglas Garlet', email: 'douglas.garlet@startcup-amf.com', password: 'DGEvaluator@2025!' },
  { name: 'Kauan Gonçalves', email: 'kauan.goncalves@startcup-amf.com', password: 'KGEvaluator@2025!' },
  { name: 'Ângelo Tissot', email: 'angelo.tissot@startcup-amf.com', password: 'ATEvaluator@2025!' },
  { name: 'Marcelo Medeiros', email: 'marcelo.medeiros@startcup-amf.com', password: 'MMEvaluator@2025!' },
  { name: 'Pedro Hermes', email: 'pedro.hermes@startcup-amf.com', password: 'PHEvaluator@2025!' },
  { name: 'Augusto', email: 'augusto@startcup-amf.com', password: 'AEvaluator@2025!' },
  { name: 'Gustavo Florêncio', email: 'gustavo.florencio@startcup-amf.com', password: 'GFEvaluator@2025!' },
  { name: 'Camile Souza Costa', email: 'camile.souza@startcup-amf.com', password: 'CSCEvaluator@2025!' },
  { name: 'Isadora Stangherlin', email: 'isadora.stangherlin@startcup-amf.com', password: 'ISEvaluator@2025!' },
  { name: 'Marcelo Diaz', email: 'marcelo.diaz@startcup-amf.com', password: 'MDEvaluator@2025!' },
  { name: 'Bruna Pfuller', email: 'bruna.pfuller@startcup-amf.com', password: 'BPEvaluator@2025!' },
  { name: 'Ana Balim', email: 'ana.balim@startcup-amf.com', password: 'ABEvaluator@2025!' },
  { name: 'Michael Silva', email: 'michael.silva@startcup-amf.com', password: 'MSEvaluator@2025!' },
  { name: 'Bruna Leão', email: 'bruna.leao@startcup-amf.com', password: 'BLEvaluator@2025!' }
];

async function checkAllEvaluators() {
  console.log('🔍 VERIFICANDO 22 AVALIADORES - APENAS DIAGNÓSTICO\n');
  console.log('='.repeat(80));
  
  // Obter todos os usuários do auth
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  
  const issues = [];
  const warnings = [];
  const success = [];
  
  for (let i = 0; i < evaluatorsList.length; i++) {
    const evaluator = evaluatorsList[i];
    const num = String(i + 1).padStart(2, '0');
    
    console.log(`\n${num}. Verificando ${evaluator.name}...`);
    
    // Verificar se existe no auth
    const authUser = authUsers.users.find(u => u.email === evaluator.email);
    
    if (!authUser) {
      console.log(`   ❌ NÃO EXISTE no auth.users`);
      issues.push({
        num,
        name: evaluator.name,
        email: evaluator.email,
        problem: 'Usuário não existe no auth.users',
        severity: 'CRÍTICO'
      });
      continue;
    }
    
    // Verificar se tem role correto
    const role = authUser.user_metadata?.role;
    if (role !== 'evaluator') {
      console.log(`   ⚠️  ROLE INCORRETO: "${role}" (esperado: "evaluator")`);
      warnings.push({
        num,
        name: evaluator.name,
        email: evaluator.email,
        problem: `Role incorreto: "${role}"`,
        severity: 'MÉDIO'
      });
    }
    
    // Verificar se email foi confirmado
    if (!authUser.email_confirmed_at) {
      console.log(`   ⚠️  EMAIL NÃO CONFIRMADO`);
      warnings.push({
        num,
        name: evaluator.name,
        email: evaluator.email,
        problem: 'Email não confirmado',
        severity: 'MÉDIO'
      });
    }
    
    // Verificar nome no metadata
    const metadataName = authUser.user_metadata?.full_name;
    if (metadataName !== evaluator.name) {
      console.log(`   ⚠️  NOME DIVERGENTE: "${metadataName}" vs "${evaluator.name}"`);
      warnings.push({
        num,
        name: evaluator.name,
        email: evaluator.email,
        problem: `Nome no metadata: "${metadataName}"`,
        severity: 'BAIXO'
      });
    }
    
    // Testar login
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: evaluator.email,
      password: evaluator.password
    });
    
    if (loginError) {
      console.log(`   ❌ LOGIN FALHOU: ${loginError.message}`);
      issues.push({
        num,
        name: evaluator.name,
        email: evaluator.email,
        problem: 'Senha incorreta ou login não funciona',
        severity: 'CRÍTICO'
      });
    } else {
      console.log(`   ✅ Login OK | Role: ${role} | Email confirmado: ${authUser.email_confirmed_at ? 'Sim' : 'Não'}`);
      success.push({
        num,
        name: evaluator.name,
        email: evaluator.email
      });
    }
  }
  
  // RELATÓRIO FINAL
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO DE INCONGRUÊNCIAS\n');
  
  console.log(`✅ FUNCIONANDO: ${success.length}/22`);
  if (success.length > 0) {
    success.forEach(s => {
      console.log(`   ${s.num}. ${s.name}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  AVISOS (${warnings.length}):`);
    warnings.forEach(w => {
      console.log(`\n   ${w.num}. [${w.severity}] ${w.name}`);
      console.log(`      Email: ${w.email}`);
      console.log(`      Problema: ${w.problem}`);
    });
  }
  
  if (issues.length > 0) {
    console.log(`\n❌ PROBLEMAS CRÍTICOS (${issues.length}):`);
    issues.forEach(issue => {
      console.log(`\n   ${issue.num}. [${issue.severity}] ${issue.name}`);
      console.log(`      Email: ${issue.email}`);
      console.log(`      Problema: ${issue.problem}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('🎉 TUDO PERFEITO! Todos os 22 avaliadores funcionando!');
  } else if (issues.length === 0) {
    console.log('✅ SEM PROBLEMAS CRÍTICOS - Apenas avisos não impeditivos.');
  } else {
    console.log(`⚠️  AÇÃO NECESSÁRIA: ${issues.length} avaliador(es) precisa(m) de correção!`);
  }
  
  console.log('='.repeat(80) + '\n');
}

checkAllEvaluators().catch(console.error);
