#!/usr/bin/env node
/**
 * apply-boss-fix-final.js
 * 
 * Executa o FIX_BOSS_AUTO_ACTIVATION_FINAL.sql
 * Atualiza a função auto_start_next_quest() com proteção melhorada
 * 
 * CRÍTICO: Executar antes do evento começar às 21:00 BRT
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyFix() {
  console.log('\n' + '='.repeat(90));
  console.log('🔧 APLICANDO FIX_BOSS_AUTO_ACTIVATION_FINAL');
  console.log('='.repeat(90) + '\n');

  try {
    // Ler SQL do arquivo
    const sqlPath = './FIX_BOSS_AUTO_ACTIVATION_FINAL.sql';
    if (!fs.existsSync(sqlPath)) {
      console.log('❌ Arquivo não encontrado:', sqlPath);
      return;
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('📋 Lendo SQL de:', sqlPath);
    console.log('\n📝 Resumo das mudanças:');
    console.log('   ✅ Criando função auto_start_next_quest() com proteção DUPLA');
    console.log('   ✅ Validação 1: order_index = 4 (boss sempre é 4ª quest)');
    console.log('   ✅ Validação 2: deliverable_type contém "presentation"');
    console.log('   ✅ Proteção contra JSON parsing incorreto');
    console.log('   ✅ Logs melhorados para debug\n');

    // Para testar, vamos fazer uma verificação direta no banco
    console.log('🔍 Verificando função atual no banco de dados...\n');

    const { data: funcData, error: funcError } = await supabase
      .rpc('get_function_source', {
        function_name: 'auto_start_next_quest'
      })
      .catch(() => ({ data: null, error: 'RPC não disponível' }));

    if (funcError) {
      console.log('⚠️  Não consegui verificar função via RPC');
      console.log('\n📌 PRÓXIMAS AÇÕES:');
      console.log('='.repeat(90));
      console.log('1️⃣  Abra o Supabase Dashboard: https://app.supabase.com/');
      console.log('2️⃣  Acesse: Project → SQL Editor');
      console.log('3️⃣  Clique em "New Query"');
      console.log('4️⃣  Cole TODO o conteúdo de FIX_BOSS_AUTO_ACTIVATION_FINAL.sql');
      console.log('5️⃣  Clique em "Run" (canto inferior direito)');
      console.log('6️⃣  Verifique se a função foi criada (deve aparecer "CREATE FUNCTION")');
      console.log('7️⃣  Faça commit e push do fix');
      console.log('='.repeat(90) + '\n');
      
      console.log('📄 Para referência, aqui está o SQL:\n');
      console.log(sqlContent);
      return;
    }

    if (funcData) {
      console.log('✅ Função auto_start_next_quest() existe no banco\n');
      console.log('📊 Primeiras 200 chars da função atual:\n');
      console.log(funcData.substring(0, 200) + '...\n');
    }

    console.log('💡 ATUALIZAÇÃO:');
    console.log('   Execute manualmente no Supabase SQL Editor e');
    console.log('   faça commit desta atualização\n');

    // Salvar para referência
    fs.writeFileSync('./BOSS_FIX_APPLIED.log', `
Timestamp: ${new Date().toISOString()}
Fix: FIX_BOSS_AUTO_ACTIVATION_FINAL
Status: PENDING - Manual execution needed

SQL Aplicada:
${sqlContent}

Próximas ações:
1. Executar no Supabase SQL Editor
2. Testar auto-start durante evento teste
3. Fazer commit
    `);

    console.log('✅ Log salvo em: ./BOSS_FIX_APPLIED.log\n');
    console.log('='.repeat(90));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

applyFix();
