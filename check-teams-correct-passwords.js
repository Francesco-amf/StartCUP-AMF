require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const teamsList = [
  { name: 'VisionOne', email: 'visionone@startcup-amf.com', password: 'VisionOne@5193!', newName: 'KonnectArt', newEmail: 'konnectart@startcup-amf.com' },
  { name: 'Código Sentencial', email: 'codigosentencial@startcup-amf.com', password: 'CodigoSentencial@4270!' },
  { name: 'Smartcampus', email: 'smartcampus@startcup-amf.com', password: 'Smartcampus@4732!' },
  { name: 'Geração F', email: 'geracaof@startcup-amf.com', password: 'GeracaoF@5746!' },
  { name: 'SparkUp', email: 'sparkup@startcup-amf.com', password: 'SparkUp@9200!' },
  { name: 'Mistos.com', email: 'mistoscom@startcup-amf.com', password: 'Mistos.com@2894!', newName: 'Mistos', newEmail: 'mistos@startcup-amf.com' },
  { name: 'Cogniverse', email: 'cogniverse@startcup-amf.com', password: 'Cogniverse@6855!' },
  { name: 'Os Notáveis', email: 'osnotaveis@startcup-amf.com', password: 'OsNotaveis@8324!' },
  { name: 'Turistando', email: 'turistando@startcup-amf.com', password: 'Turistando@5936!' },
  { name: 'S.Y.M.', email: 'sym@startcup-amf.com', password: 'S.Y.M.@6468!' },
  { name: 'Gastroproject', email: 'gastroproject@startcup-amf.com', password: 'Gastroproject@8808!' },
  { name: 'MOVA', email: 'mova@startcup-amf.com', password: 'MOVA@5417!' },
  { name: 'Áurea Forma', email: 'aureaforma@startcup-amf.com', password: 'AureaForma@4911!' },
  { name: 'Lumus', email: 'lumus@startcup-amf.com', password: 'Lumus@7135!' },
  { name: 'Outsiders', email: 'outsiders@startcup-amf.com', password: 'Outsiders@9930!' }
];

async function checkTeamsWithCorrectPasswords() {
  console.log('🔍 VERIFICANDO 15 EQUIPES COM SENHAS CORRETAS\n');
  console.log('='.repeat(80));
  
  // Obter todos os usuários do auth
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  
  // Obter todas as equipes da tabela teams
  const { data: teamsInDb } = await supabase
    .from('teams')
    .select('*')
    .order('name');
  
  const issues = [];
  const warnings = [];
  const success = [];
  const needsEmailUpdate = [];
  
  for (let i = 0; i < teamsList.length; i++) {
    const team = teamsList[i];
    const num = String(i + 1).padStart(2, '0');
    
    console.log(`\n${num}. Verificando ${team.name}...`);
    
    // Verificar se existe no auth (com email atual)
    let authUser = authUsers.users.find(u => u.email === team.email);
    
    // Se tem novo email, verificar também
    if (!authUser && team.newEmail) {
      authUser = authUsers.users.find(u => u.email === team.newEmail);
      if (authUser) {
        console.log(`   ⚠️  Encontrado com NOVO email: ${team.newEmail}`);
      }
    }
    
    if (!authUser) {
      console.log(`   ❌ NÃO EXISTE no auth.users`);
      issues.push({
        num,
        name: team.name,
        email: team.email,
        problem: 'Usuário não existe no auth.users',
        severity: 'CRÍTICO'
      });
      continue;
    }
    
    console.log(`   Email atual no auth: ${authUser.email}`);
    
    // Se o email está diferente do esperado
    if (team.newEmail && authUser.email !== team.newEmail) {
      console.log(`   ⚠️  Email precisa ser atualizado: ${authUser.email} → ${team.newEmail}`);
      needsEmailUpdate.push({
        num,
        name: team.name,
        currentEmail: authUser.email,
        newEmail: team.newEmail,
        userId: authUser.id
      });
    }
    
    // Verificar se está na tabela teams
    const teamInDb = teamsInDb?.find(t => t.email === authUser.email || (team.newEmail && t.email === team.newEmail));
    
    if (!teamInDb) {
      console.log(`   ⚠️  NÃO ESTÁ na tabela teams`);
      warnings.push({
        num,
        name: team.name,
        email: authUser.email,
        problem: 'Não está cadastrado na tabela teams',
        severity: 'MÉDIO'
      });
    } else {
      console.log(`   ✅ Cadastrado na tabela teams como: "${teamInDb.name}"`);
      
      // Verificar se nome precisa atualizar
      if (team.newName && teamInDb.name !== team.newName) {
        console.log(`   ⚠️  Nome na tabela precisa atualizar: "${teamInDb.name}" → "${team.newName}"`);
        warnings.push({
          num,
          name: team.name,
          email: authUser.email,
          problem: `Nome desatualizado na tabela teams: "${teamInDb.name}"`,
          severity: 'BAIXO',
          suggestion: `Atualizar para "${team.newName}"`
        });
      }
      
      // Verificar se email na tabela precisa atualizar
      if (team.newEmail && teamInDb.email !== team.newEmail) {
        console.log(`   ⚠️  Email na tabela precisa atualizar: "${teamInDb.email}" → "${team.newEmail}"`);
        warnings.push({
          num,
          name: team.name,
          email: teamInDb.email,
          problem: `Email desatualizado na tabela teams`,
          severity: 'MÉDIO',
          suggestion: `Atualizar para "${team.newEmail}"`
        });
      }
    }
    
    // Testar login
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: team.password
    });
    
    if (loginError) {
      console.log(`   ❌ LOGIN FALHOU: ${loginError.message}`);
      issues.push({
        num,
        name: team.name,
        email: authUser.email,
        problem: 'Senha incorreta',
        severity: 'CRÍTICO'
      });
    } else {
      console.log(`   ✅ Login funcionando!`);
      success.push({
        num,
        name: team.name,
        email: authUser.email,
        needsUpdate: team.newEmail || team.newName
      });
    }
  }
  
  // RELATÓRIO FINAL
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO DE INCONGRUÊNCIAS - EQUIPES\n');
  
  console.log(`✅ LOGIN FUNCIONANDO: ${success.length}/15`);
  if (success.length > 0) {
    success.forEach(s => {
      console.log(`   ${s.num}. ${s.name} ${s.needsUpdate ? '(precisa atualizar nome/email)' : ''}`);
    });
  }
  
  if (needsEmailUpdate.length > 0) {
    console.log(`\n🔄 MUDANÇAS DE EMAIL NECESSÁRIAS (${needsEmailUpdate.length}):`);
    needsEmailUpdate.forEach(item => {
      console.log(`\n   ${item.num}. ${item.name}`);
      console.log(`      De: ${item.currentEmail}`);
      console.log(`      Para: ${item.newEmail}`);
      console.log(`      User ID: ${item.userId}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  AVISOS (${warnings.length}):`);
    const grouped = {};
    warnings.forEach(w => {
      if (!grouped[w.num]) grouped[w.num] = [];
      grouped[w.num].push(w);
    });
    
    Object.keys(grouped).forEach(num => {
      const teamWarnings = grouped[num];
      console.log(`\n   ${num}. ${teamWarnings[0].name} (${teamWarnings[0].email})`);
      teamWarnings.forEach(w => {
        console.log(`      - [${w.severity}] ${w.problem}`);
        if (w.suggestion) {
          console.log(`        💡 ${w.suggestion}`);
        }
      });
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
  
  if (issues.length === 0 && warnings.length === 0 && needsEmailUpdate.length === 0) {
    console.log('🎉 TUDO PERFEITO! Todas as 15 equipes funcionando!');
  } else if (issues.length === 0) {
    console.log('✅ SEM PROBLEMAS CRÍTICOS - Avisos e atualizações de nome/email disponíveis.');
  } else {
    console.log(`⚠️  AÇÃO NECESSÁRIA: ${issues.length} equipe(s) com senha incorreta!`);
  }
  
  console.log('='.repeat(80) + '\n');
}

checkTeamsWithCorrectPasswords().catch(console.error);
