#!/usr/bin/env node
/**
 * verify-boss-fix.js
 * 
 * Verifica se o FIX_BOSS_AUTO_ACTIVATION_FINAL foi aplicado corretamente
 * Executa queries para confirmar proteção está em lugar
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyFix() {
  console.log('\n' + '='.repeat(90));
  console.log('🔍 VERIFICANDO SE FIX_BOSS_AUTO_ACTIVATION FOI APLICADO');
  console.log('='.repeat(90) + '\n');

  try {
    // Verificar se a função contém a lógica de proteção
    const { data: result, error } = await supabase
      .from('_pg_functions')
      .select('*')
      .eq('name', 'auto_start_next_quest')
      .single()
      .catch(() => ({ data: null, error: 'Table não existe' }));

    if (error) {
      console.log('⚠️  Não consegui verificar via tabela de functions\n');
      
      // Plan B: fazer teste funcional
      console.log('📋 PLANO B - Teste Funcional:');
      console.log('='.repeat(90));
      console.log('\n1️⃣  Abra Supabase SQL Editor');
      console.log('2️⃣  Execute esta query:\n');
      
      const testQuery = `
SELECT 
  proname as "Função",
  LENGTH(prosrc) as "Tamanho (bytes)",
  CASE 
    WHEN prosrc ILIKE '%🛑 BLOQUEADO%' THEN '✅ FIX APLICADO'
    WHEN prosrc ILIKE '%presentation%' THEN '⚠️  PARCIAL (verificar)'
    ELSE '❌ FIX NÃO ENCONTRADO'
  END as "Status"
FROM pg_proc 
WHERE proname = 'auto_start_next_quest'
LIMIT 1;
      `;
      
      console.log(testQuery);
      
      console.log('\n3️⃣  Procure no resultado:');
      console.log('   ✅ Se encontrar "🛑 BLOQUEADO" → FIX APLICADO CORRETAMENTE');
      console.log('   ⚠️  Se encontrar "presentation" mas sem "🛑" → FIX INCOMPLETO');
      console.log('   ❌ Se nada encontrar → FIX NÃO APLICADO\n');
      
      console.log('='.repeat(90));
      console.log('\n4️⃣  ALTERNATIVA - Execute este SQL se quiser fazer patch rápido:\n');
      
      const quickCheck = `
-- Verificar se função tem proteção
SELECT 
  CASE 
    WHEN LENGTH(prosrc) > 3000 THEN '✅ Função grande o suficiente (provavelmente tem fix)'
    ELSE '❌ Função pequena (pode estar versão antiga)'
  END as "Tamanho",
  CASE
    WHEN prosrc ILIKE '%order_index = 4%' THEN '✅ Tem validação de order_index'
    ELSE '❌ Falta validação de order_index'
  END as "Validação 1",
  CASE
    WHEN prosrc ILIKE '%ILIKE ''%presentation%'' THEN '✅ Tem validação de deliverable_type'
    ELSE '❌ Falta validação de deliverable_type'
  END as "Validação 2"
FROM pg_proc
WHERE proname = 'auto_start_next_quest';
      `;
      
      console.log(quickCheck);
      
      console.log('\n5️⃣  Se alguma validação estiver ❌, execute FIX_BOSS_AUTO_ACTIVATION_FINAL.sql novamente');
      return;
    }

    if (result) {
      console.log('✅ Função encontrada!\n');
      console.log('📊 Detalhes:');
      console.log(`   Nome: ${result.name}`);
      console.log(`   Tamanho: ${result.length || 'N/A'} bytes\n`);
    }

    // Teste adicional: listar quests para verificar estrutura
    console.log('📋 Verificando estrutura de quests (boss validation):\n');
    
    const { data: bosses, error: bossError } = await supabase
      .from('quests')
      .select('phase_id, order_index, deliverable_type')
      .eq('order_index', 4)
      .limit(1)
      .single()
      .catch(() => ({ data: null, error: 'Sem dados' }));

    if (!bossError && bosses) {
      console.log('✅ Boss quest encontrada (order_index=4):');
      console.log(`   Deliverable Type: ${bosses.deliverable_type}`);
      console.log(`   Tipo do campo: ${typeof bosses.deliverable_type}\n`);
      
      if (typeof bosses.deliverable_type === 'string' && bosses.deliverable_type.includes('presentation')) {
        console.log('✅ Deliverable type tem "presentation" - fix deve funcionar\n');
      }
    }

    console.log('='.repeat(90));
    console.log('\n📌 PRÓXIMAS AÇÕES:');
    console.log('1. Execute o SQL de verificação acima no Supabase SQL Editor');
    console.log('2. Procure pelas marcas ✅ e ❌');
    console.log('3. Se tudo ✅ → FIX está pronto');
    console.log('4. Se tiver ❌ → Aplique FIX_BOSS_AUTO_ACTIVATION_FINAL.sql novamente\n');
    console.log('='.repeat(90) + '\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n⚠️  Se você recebeu erro de conexão, verifique:');
    console.log('   1. .env.local está presente?');
    console.log('   2. NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão corretos?');
    console.log('   3. Conexão de internet?');
  }
}

verifyFix();
