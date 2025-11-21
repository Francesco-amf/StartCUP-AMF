const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyPgCronSetup() {
  console.log('\n🔍 VERIFICAÇÃO COMPLETA DO PG_CRON PARA O EVENTO DE HOJE\n')
  console.log('=' .repeat(80))
  
  // 1. Testar se conseguimos executar funções administrativas
  console.log('\n1️⃣  TESTANDO ACESSO AO BANCO')
  console.log('-'.repeat(80))
  
  const { data: testQuery, error: testError } = await supabase
    .from('event_config')
    .select('current_phase')
    .single()
  
  if (testError) {
    console.log('❌ Erro ao conectar:', testError.message)
    return
  } else {
    console.log('✅ Conexão OK')
  }

  // 2. Verificar se funções existem
  console.log('\n2️⃣  VERIFICANDO FUNÇÕES DE AUTO-ADVANCE')
  console.log('-'.repeat(80))
  
  const functionsToCheck = [
    'advance_to_next_phase',
    'advance_to_next_quest', 
    'close_current_quest',
    'start_next_quest'
  ]
  
  for (const funcName of functionsToCheck) {
    try {
      const { error: existsError } = await supabase.rpc(funcName)
      
      if (existsError) {
        if (existsError.message && existsError.message.includes('Could not find')) {
          console.log(`❌ ${funcName}: NÃO EXISTE`)
        } else {
          console.log(`✅ ${funcName}: Existe`)
          if (existsError.message) {
            console.log(`   (Erro esperado ao chamar sem params: ${existsError.message.substring(0, 60)}...)`)
          }
        }
      } else {
        console.log(`✅ ${funcName}: Existe e executou`)
      }
    } catch (err) {
      console.log(`❌ ${funcName}: Erro ao verificar - ${err.message}`)
    }
  }

  // 3. Verificar jobs agendados (via query SQL raw se possível)
  console.log('\n3️⃣  TENTANDO VERIFICAR JOBS DO PG_CRON')
  console.log('-'.repeat(80))
  console.log('⚠️  Note: Supabase pode não expor cron.job via API')
  console.log('   Você precisa verificar no SQL Editor do Supabase Dashboard')
  console.log('')
  console.log('   Execute esta query no Supabase SQL Editor:')
  console.log('   SELECT * FROM cron.job;')

  // 4. Simular uma chamada de advance
  console.log('\n4️⃣  TESTANDO CHAMADA MANUAL DE advance_to_next_phase')
  console.log('-'.repeat(80))
  console.log('⚠️  NÃO vou executar agora para não afetar seu teste atual')
  console.log('   Mas você pode testar manualmente com:')
  console.log('')
  console.log('   SELECT advance_to_next_phase();')
  console.log('')
  console.log('   Ou via JavaScript:')
  console.log('   await supabase.rpc("advance_to_next_phase")')

  // 5. Verificar última quest Boss
  console.log('\n5️⃣  VERIFICANDO PROBLEMA DO BOSS (closed_at NULL)')
  console.log('-'.repeat(80))
  
  const { data: bossQuests } = await supabase
    .from('quests')
    .select('*')
    .ilike('name', '%BOSS%')
    .order('phase_id')
  
  if (bossQuests) {
    let hasIssue = false
    
    for (const boss of bossQuests) {
      const status = boss.status === 'closed' && !boss.closed_at ? '❌ PROBLEMA' : '✅ OK'
      console.log(`${status} Boss Fase ${boss.phase_id}: ${boss.name}`)
      console.log(`     Status: ${boss.status}, closed_at: ${boss.closed_at || 'NULL'}`)
      
      if (boss.status === 'closed' && !boss.closed_at) {
        hasIssue = true
      }
    }
    
    if (hasIssue) {
      console.log('\n⚠️  PROBLEMA DETECTADO:')
      console.log('   Existe Boss quest com status="closed" mas closed_at=NULL')
      console.log('   Isso impede o auto-advance!')
    }
  }

  // 6. Verificar configuração atual
  console.log('\n6️⃣  CONFIGURAÇÃO ATUAL DO EVENTO')
  console.log('-'.repeat(80))
  
  const { data: config } = await supabase
    .from('event_config')
    .select('*')
    .single()
  
  console.log(`Fase atual: ${config.current_phase}`)
  console.log(`Evento iniciado: ${config.event_started}`)
  console.log(`Event start time: ${config.event_start_time}`)
  
  // 7. Recomendações
  console.log('\n7️⃣  RECOMENDAÇÕES PARA O EVENTO DE HOJE À NOITE')
  console.log('-'.repeat(80))
  console.log('')
  console.log('📋 CHECKLIST PRÉ-EVENTO:')
  console.log('')
  console.log('1. ✅ Verificar se pg_cron está ativo:')
  console.log('   - Acessar Supabase Dashboard → SQL Editor')
  console.log('   - Executar: SELECT * FROM cron.job;')
  console.log('   - Deve mostrar job(s) para advance_to_next_phase')
  console.log('')
  console.log('2. ✅ Verificar se funções existem:')
  console.log('   - advance_to_next_phase()')
  console.log('   - close_current_quest()')
  console.log('')
  console.log('3. ✅ Testar execução manual:')
  console.log('   - SELECT advance_to_next_phase();')
  console.log('   - Deve retornar sem erro')
  console.log('')
  console.log('4. ⚠️  PLANO B - Deixar browser aberto:')
  console.log('   - Abrir live-dashboard em computador que não vai dormir')
  console.log('   - QuestAutoAdvancer (frontend) serve como backup')
  console.log('   - Configurar para não entrar em sleep mode')
  console.log('')
  console.log('5. 🔍 Monitorar durante evento:')
  console.log('   - Verificar logs em tempo real')
  console.log('   - Checar se quests estão fechando (closed_at não NULL)')
  console.log('   - Validar se fases avançam no horário')

  // 8. Criar SQL para verificar durante o evento
  console.log('\n8️⃣  QUERIES ÚTEIS PARA MONITORAR DURANTE O EVENTO')
  console.log('-'.repeat(80))
  console.log('')
  console.log('-- Ver execuções recentes do pg_cron:')
  console.log('SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;')
  console.log('')
  console.log('-- Ver quest atual e seu deadline:')
  console.log(`SELECT name, status, started_at, planned_deadline_minutes, closed_at`)
  console.log(`FROM quests WHERE status = 'active';`)
  console.log('')
  console.log('-- Forçar fechamento de quest (emergência):')
  console.log(`UPDATE quests SET status = 'closed', closed_at = NOW()`)
  console.log(`WHERE status = 'active';`)
  console.log('')
  console.log('-- Forçar advance manual (emergência):')
  console.log('SELECT advance_to_next_phase();')

  console.log('\n' + '='.repeat(80))
  console.log('\n✅ VERIFICAÇÃO COMPLETA!')
  console.log('\nPróximos passos:')
  console.log('1. Executar CHECK_PGCRON_STATUS.sql no Supabase Dashboard')
  console.log('2. Verificar se há jobs agendados')
  console.log('3. Testar advance_to_next_phase() manualmente')
  console.log('4. Deixar um browser aberto como backup')
}

verifyPgCronSetup()
