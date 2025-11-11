#!/usr/bin/env node

/**
 * 🔍 Script de Diagnóstico - Quest Congelada na Live Dashboard
 *
 * Este script automaticamente:
 * 1. Verifica se quest tem started_at no banco
 * 2. Verifica se phaseStartTime está setado
 * 3. Verifica se polling está funcionando
 * 4. Fornece recomendações baseado nos achados
 *
 * Uso: node scripts/diagnose-quest-issue.js
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n🔍 INICIANDO DIAGNÓSTICO DA QUEST CONGELADA\n')
console.log('=' .repeat(60))

// Validar configuração
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\n❌ ERRO: Variáveis de ambiente não configuradas!')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const supabaseAdmin = SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null

async function diagnose() {
  try {
    console.log('\n📋 TESTE 1: Verificando event_config...\n')

    // Buscar event_config
    const { data: eventConfig, error: configError } = await supabase
      .from('event_config')
      .select('*')
      .single()

    if (configError) {
      console.error('❌ Erro ao buscar event_config:', configError)
      return
    }

    if (!eventConfig) {
      console.error('❌ event_config não encontrado')
      return
    }

    const currentPhase = eventConfig.current_phase
    const phaseStartColumn = `phase_${currentPhase}_start_time`
    const phaseStartTime = eventConfig[phaseStartColumn]

    console.log(`✅ Event Config encontrado:`)
    console.log(`   - Current Phase: ${currentPhase}`)
    console.log(`   - Phase Start Time (${phaseStartColumn}): ${phaseStartTime || '❌ NULL'}`)
    console.log(`   - Event Started: ${eventConfig.event_started ? '✅ SIM' : '❌ NÃO'}`)
    console.log(`   - Event Ended: ${eventConfig.event_ended ? '✅ SIM' : '❌ NÃO'}`)

    if (!phaseStartTime) {
      console.log(`\n   ⚠️  AVISO: ${phaseStartColumn} está NULL!`)
      console.log(`       Isso significa a fase não foi iniciada corretamente.`)
    }

    // Buscar fases
    console.log('\n📋 TESTE 2: Buscando fase atual...\n')

    const { data: phases, error: phaseError } = await supabase
      .from('phases')
      .select('*')
      .eq('order_index', currentPhase)
      .single()

    if (phaseError) {
      console.error('❌ Erro ao buscar fase:', phaseError)
      return
    }

    console.log(`✅ Fase ${currentPhase} encontrada:`)
    console.log(`   - ID: ${phases.id}`)
    console.log(`   - Duração: ${phases.duration_minutes} minutos`)

    // Buscar quests da fase
    console.log(`\n📋 TESTE 3: Buscando quests da Fase ${currentPhase}...\n`)

    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('id, order_index, name, status, started_at, duration_minutes')
      .eq('phase_id', phases.id)
      .order('order_index')

    if (questsError) {
      console.error('❌ Erro ao buscar quests:', questsError)
      return
    }

    if (!quests || quests.length === 0) {
      console.error('❌ Nenhuma quest encontrada para a fase!')
      return
    }

    console.log(`✅ ${quests.length} quests encontradas:`)
    console.log('')

    let hasActiveQuest = false
    let questWithoutStartedAt = null

    quests.forEach((q) => {
      const status = q.status === 'active' ? '🔴 ATIVA' : q.status === 'closed' ? '✅ FECHADA' : '⏳ AGENDADA'
      const hasStarted = q.started_at ? '✅' : '❌'
      const startedAtStr = q.started_at ? new Date(q.started_at).toLocaleString('pt-BR') : 'NULL'

      console.log(`   [${q.order_index}] ${q.name}`)
      console.log(`       Status: ${status}`)
      console.log(`       Started At: ${hasStarted} ${startedAtStr}`)
      console.log(`       Duration: ${q.duration_minutes} min`)
      console.log('')

      if (q.status === 'active') {
        hasActiveQuest = true
        if (!q.started_at) {
          questWithoutStartedAt = q
        }
      }
    })

    // Diagnóstico final
    console.log('=' .repeat(60))
    console.log('\n🎯 DIAGNÓSTICO FINAL:\n')

    const issues = []
    const recommendations = []

    if (!phaseStartTime) {
      issues.push('❌ Phase start time não está setado')
      recommendations.push('🔧 Clique "Start Phase" no admin antes de começar as quests')
    }

    if (!hasActiveQuest) {
      issues.push('❌ Nenhuma quest ativa encontrada')
      recommendations.push('🔧 Clique "Start Quest" no admin para iniciar uma quest')
    } else if (questWithoutStartedAt) {
      issues.push(`❌ Quest ativa "${questWithoutStartedAt.name}" não tem started_at`)
      recommendations.push('🔧 Verifique se o endpoint /api/admin/advance-quest foi chamado com sucesso')
      recommendations.push('🔧 Verifique se SUPABASE_SERVICE_ROLE_KEY está correto em .env.local')
      recommendations.push('🔧 Verifique se admin user tem role="admin" no Auth')
    }

    if (issues.length === 0) {
      console.log('✅ TUDO PARECE ESTAR OK!')
      console.log('\nMas o timer ainda mostra 0:00? Então o problema pode ser:')
      console.log('1. Cache do browser (tente CTRL+SHIFT+DEL para limpar)')
      console.log('2. Timezone issue (verify timestamps no console)')
      console.log('3. Polling não está atualizando (refresh a página)')
    } else {
      console.log('PROBLEMAS ENCONTRADOS:')
      issues.forEach(issue => console.log(`\n${issue}`))

      console.log('\n\nRECOMENDAÇÕES:')
      recommendations.forEach((rec, i) => console.log(`${i + 1}. ${rec}`))
    }

    console.log('\n' + '=' .repeat(60))

    // Teste de endpoint (se tiver service_role_key)
    if (supabaseAdmin && hasActiveQuest && questWithoutStartedAt) {
      console.log('\n📋 TESTE 4: Tentando chamar endpoint advance-quest...\n')

      const { data: allQuests } = await supabaseAdmin
        .from('quests')
        .select('id, order_index, status, phase_id')
        .eq('phase_id', phases.id)
        .order('order_index')

      if (allQuests && allQuests.length > 0) {
        const previousQuest = allQuests.find(q => q.status === 'closed') || allQuests[0]

        console.log(`🧪 Simulando avanço de quest ${previousQuest.order_index}...`)

        try {
          const response = await fetch('/api/admin/advance-quest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questId: previousQuest.id })
          })

          const result = await response.json()

          if (response.ok) {
            console.log('✅ Endpoint respondeu com sucesso!')
            console.log(`   Response: ${JSON.stringify(result, null, 2)}`)
          } else {
            console.error('❌ Endpoint retornou erro:', result)
          }
        } catch (err) {
          console.error('❌ Erro ao chamar endpoint:', err.message)
          console.log('   (Esperado se executando em node.js em vez do browser)')
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error)
  }
}

diagnose()
