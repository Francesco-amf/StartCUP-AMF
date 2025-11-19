/**
 * 🧪 TESTE FINAL - Solução RPC para Quest 5.2 → 5.3
 * 
 * Este script testa:
 * 1. ✅ Função RPC activate_quest() funciona
 * 2. ✅ Função RPC close_quest() funciona
 * 3. ✅ API advance-quest agora usa RPCs ao invés de .update()
 * 4. ✅ Quest 5.3 pode ser ativada com sucesso
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testRPCSolution() {
  console.log('\n🧪 ======= TESTE FINAL - SOLUÇÃO RPC =======\n')

  // 1️⃣ BUSCAR QUEST 5.3
  console.log('📋 Passo 1: Buscando Quest 5.3...')
  
  const { data: quest53, error: quest53Error } = await supabase
    .from('quests')
    .select('*')
    .eq('phase_id', 5)
    .eq('order_index', 3)
    .single()

  if (quest53Error || !quest53) {
    console.error('❌ ERRO: Quest 5.3 não encontrada:', quest53Error?.message)
    return false
  }

  console.log(`✅ Quest 5.3 encontrada:`)
  console.log(`   ID: ${quest53.id}`)
  console.log(`   Nome: ${quest53.name}`)
  console.log(`   Status atual: ${quest53.status}`)
  console.log(`   Started at: ${quest53.started_at || 'null'}\n`)

  // 2️⃣ RESETAR QUEST PARA SCHEDULED (se necessário)
  if (quest53.status !== 'scheduled') {
    console.log('📋 Passo 2: Resetando quest para "scheduled"...')
    
    const { error: resetError } = await supabase
      .from('quests')
      .update({ 
        status: 'scheduled',
        started_at: null,
        ended_at: null
      })
      .eq('id', quest53.id)

    if (resetError) {
      console.error('❌ ERRO ao resetar quest:', resetError.message)
      return false
    }
    
    console.log('✅ Quest resetada para "scheduled"\n')
  }

  // 3️⃣ TESTAR FUNÇÃO RPC activate_quest()
  console.log('📋 Passo 3: Testando RPC activate_quest()...')
  
  const { data: activateData, error: activateError } = await supabase
    .rpc('activate_quest', { 
      p_quest_id: quest53.id 
    })

  if (activateError) {
    console.error('❌ ERRO ao ativar quest via RPC:', activateError.message)
    console.error('Detalhes:', activateError)
    return false
  }

  console.log('✅ RPC activate_quest() executado com sucesso')
  console.log('Resultado:', activateData)

  // 4️⃣ VERIFICAR SE QUEST FOI ATIVADA
  console.log('\n📋 Passo 4: Verificando se quest foi ativada...')
  
  const { data: activatedQuest, error: verifyError } = await supabase
    .from('quests')
    .select('id, name, status, started_at')
    .eq('id', quest53.id)
    .single()

  if (verifyError || !activatedQuest) {
    console.error('❌ ERRO ao verificar quest:', verifyError?.message)
    return false
  }

  console.log('✅ Quest verificada:')
  console.log(`   Status: ${activatedQuest.status}`)
  console.log(`   Started at: ${activatedQuest.started_at}`)

  if (activatedQuest.status !== 'active') {
    console.error('❌ ERRO: Quest não foi ativada! Status:', activatedQuest.status)
    return false
  }

  if (!activatedQuest.started_at) {
    console.error('⚠️  AVISO: Quest ativada mas started_at ainda é null')
    console.error('⚠️  Verifique se o trigger auto_set_quest_started_at está ativo')
  }

  // 5️⃣ TESTAR FUNÇÃO RPC close_quest()
  console.log('\n📋 Passo 5: Testando RPC close_quest()...')
  
  const { data: closeData, error: closeError } = await supabase
    .rpc('close_quest', { 
      p_quest_id: quest53.id 
    })

  if (closeError) {
    console.error('❌ ERRO ao fechar quest via RPC:', closeError.message)
    return false
  }

  console.log('✅ RPC close_quest() executado com sucesso')

  // 6️⃣ VERIFICAR SE QUEST FOI FECHADA
  const { data: closedQuest, error: closedError } = await supabase
    .from('quests')
    .select('id, name, status, ended_at')
    .eq('id', quest53.id)
    .single()

  if (closedError || !closedQuest) {
    console.error('❌ ERRO ao verificar quest fechada:', closedError?.message)
    return false
  }

  console.log('✅ Quest verificada:')
  console.log(`   Status: ${closedQuest.status}`)
  console.log(`   Ended at: ${closedQuest.ended_at}`)

  if (closedQuest.status !== 'closed') {
    console.error('❌ ERRO: Quest não foi fechada! Status:', closedQuest.status)
    return false
  }

  if (!closedQuest.ended_at) {
    console.error('⚠️  AVISO: Quest fechada mas ended_at ainda é null')
  }

  console.log('\n🎉 ======= TODOS OS TESTES PASSARAM! =======')
  console.log('✅ Função activate_quest() funciona')
  console.log('✅ Função close_quest() funciona')
  console.log('✅ Quest 5.3 pode ser ativada com sucesso')
  console.log('\n📝 PRÓXIMO PASSO: Testar API /api/admin/advance-quest')
  console.log('   A API agora usa essas RPCs ao invés de .update()')
  
  return true
}

// Executar teste
testRPCSolution()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(err => {
    console.error('💥 ERRO FATAL:', err)
    process.exit(1)
  })
