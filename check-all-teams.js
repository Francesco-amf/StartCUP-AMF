require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const teamsList = [
  { name: 'Áurea Forma', email: 'aureaforma@startcup-amf.com', password: 'AureaForma@2025!' },
  { name: 'Código Sentencial (CS)', email: 'codigosentencial@startcup-amf.com', password: 'CodigoSentencial@2025!' },
  { name: 'Cogniverse', email: 'cogniverse@startcup-amf.com', password: 'Cogniverse@2025!' },
  { name: 'Gastroproject', email: 'gastroproject@startcup-amf.com', password: 'Gastroproject@2025!' },
  { name: 'Geração F', email: 'geracaof@startcup-amf.com', password: 'GeracaoF@2025!' },
  { name: 'KonnectArt', email: 'konnectart@startcup-amf.com', password: 'KonnectArt@2025!', oldName: 'Visonone' },
  { name: 'Lumus', email: 'lumus@startcup-amf.com', password: 'Lumus@2025!' },
  { name: 'Mistos', email: 'mistos@startcup-amf.com', password: 'Mistos@2025!', oldName: 'Mistos.com' },
  { name: 'MOVA', email: 'mova@startcup-amf.com', password: 'Mova@2025!' },
  { name: 'Os Notáveis', email: 'osnotaveis@startcup-amf.com', password: 'OsNotaveis@2025!' },
  { name: 'Outsiders', email: 'outsiders@startcup-amf.com', password: 'Outsiders@2025!' },
  { name: 'S.Y.M.', email: 'sym@startcup-amf.com', password: 'SYM@2025!' },
  { name: 'Smartcampus', email: 'smartcampus@startcup-amf.com', password: 'Smartcampus@2025!' },
  { name: 'SparkUp', email: 'sparkup@startcup-amf.com', password: 'SparkUp@2025!' },
  { name: 'Turistando', email: 'turistando@startcup-amf.com', password: 'Turistando@2025!' }
];

async function checkAllTeams() {
  console.log('🔍 VERIFICANDO 15 EQUIPES - APENAS DIAGNÓSTICO\n');
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
  
  for (let i = 0; i < teamsList.length; i++) {
    const team = teamsList[i];
    const num = String(i + 1).padStart(2, '0');
    
    console.log(`\n${num}. Verificando ${team.name}...`);
    if (team.oldName) {
      console.log(`   (Antigo nome: ${team.oldName})`);
    }
    
    // Verificar se existe no auth
    const authUser = authUsers.users.find(u => u.email === team.email);
    
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
    
    // Verificar se tem role correto
    const role = authUser.user_metadata?.role;
    if (role && role !== 'team') {
      console.log(`   ⚠️  ROLE INCORRETO: "${role}" (esperado: sem role ou "team")`);
      warnings.push({
        num,
        name: team.name,
        email: team.email,
        problem: `Role incorreto: "${role}"`,
        severity: 'BAIXO'
      });
    }
    
    // Verificar se email foi confirmado
    if (!authUser.email_confirmed_at) {
      console.log(`   ⚠️  EMAIL NÃO CONFIRMADO`);
      warnings.push({
        num,
        name: team.name,
        email: team.email,
        problem: 'Email não confirmado',
        severity: 'MÉDIO'
      });
    }
    
    // Verificar se está na tabela teams
    const teamInDb = teamsInDb?.find(t => t.email === team.email);
    
    if (!teamInDb) {
      console.log(`   ⚠️  NÃO ESTÁ na tabela teams`);
      warnings.push({
        num,
        name: team.name,
        email: team.email,
        problem: 'Não está cadastrado na tabela teams',
        severity: 'MÉDIO'
      });
    } else {
      // Verificar nome na tabela teams
      if (teamInDb.name !== team.name) {
        console.log(`   ⚠️  NOME DIFERENTE na tabela: "${teamInDb.name}" vs "${team.name}"`);
        warnings.push({
          num,
          name: team.name,
          email: team.email,
          problem: `Nome na tabela teams: "${teamInDb.name}"`,
          severity: 'BAIXO',
          suggestion: team.oldName ? `Atualizar de "${teamInDb.name}" para "${team.name}"` : null
        });
      }
    }
    
    // Verificar nome no metadata do auth
    const metadataName = authUser.user_metadata?.full_name;
    if (metadataName && metadataName !== team.name) {
      console.log(`   ⚠️  NOME DIVERGENTE no auth: "${metadataName}" vs "${team.name}"`);
      warnings.push({
        num,
        name: team.name,
        email: team.email,
        problem: `Nome no auth metadata: "${metadataName}"`,
        severity: 'BAIXO',
        suggestion: team.oldName ? `Atualizar de "${metadataName}" para "${team.name}"` : null
      });
    }
    
    // Testar login
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: team.email,
      password: team.password
    });
    
    if (loginError) {
      console.log(`   ❌ LOGIN FALHOU: ${loginError.message}`);
      issues.push({
        num,
        name: team.name,
        email: team.email,
        problem: 'Senha incorreta ou login não funciona',
        severity: 'CRÍTICO'
      });
    } else {
      console.log(`   ✅ Login OK | Na tabela teams: ${teamInDb ? 'Sim' : 'Não'} | Email confirmado: ${authUser.email_confirmed_at ? 'Sim' : 'Não'}`);
      success.push({
        num,
        name: team.name,
        email: team.email,
        inTeamsTable: !!teamInDb
      });
    }
  }
  
  // RELATÓRIO FINAL
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO DE INCONGRUÊNCIAS - EQUIPES\n');
  
  console.log(`✅ LOGIN FUNCIONANDO: ${success.length}/15`);
  if (success.length > 0) {
    success.forEach(s => {
      console.log(`   ${s.num}. ${s.name} ${!s.inTeamsTable ? '(não está em teams)' : ''}`);
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
          console.log(`        💡 Sugestão: ${w.suggestion}`);
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
  
  // Verificar se há equipes na tabela teams que não estão na lista
  console.log('\n📋 VERIFICAÇÃO REVERSA - Equipes na tabela teams:');
  const teamEmails = teamsList.map(t => t.email);
  const extraTeams = teamsInDb?.filter(t => !teamEmails.includes(t.email));
  
  if (extraTeams && extraTeams.length > 0) {
    console.log(`\n⚠️  ${extraTeams.length} equipe(s) na tabela teams NÃO estão na lista de verificação:`);
    extraTeams.forEach(t => {
      console.log(`   - ${t.name} (${t.email})`);
    });
  } else {
    console.log('   ✅ Todas as equipes na tabela estão na lista de verificação');
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('🎉 TUDO PERFEITO! Todas as 15 equipes funcionando!');
  } else if (issues.length === 0) {
    console.log('✅ SEM PROBLEMAS CRÍTICOS - Apenas avisos não impeditivos.');
  } else {
    console.log(`⚠️  AÇÃO NECESSÁRIA: ${issues.length} equipe(s) precisa(m) de correção!`);
  }
  
  console.log('='.repeat(80) + '\n');
}

checkAllTeams().catch(console.error);
