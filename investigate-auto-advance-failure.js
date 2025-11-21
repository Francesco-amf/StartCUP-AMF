const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function investigateAutoAdvance() {
  console.log('\n🔍 INVESTIGAÇÃO: POR QUE AUTO-ADVANCE FALHOU?\n')
  console.log('=' .repeat(80))
  
  // 1. Verificar pg_cron jobs
  console.log('\n📋 VERIFICANDO PG_CRON JOBS')
  console.log('-'.repeat(80))
  
  try {
    const { data: cronJobs, error: cronError } = await supabase.rpc('get_cron_jobs')
    
    if (cronError) {
      console.log('⚠️  Não foi possível verificar pg_cron:', cronError.message)
    } else if (cronJobs) {
      console.log('Jobs ativos:')
      console.log(JSON.stringify(cronJobs, null, 2))
    }
  } catch (err) {
    console.log('⚠️  pg_cron não está acessível (pode não estar habilitado)')
  }

  // 2. Verificar todas as quests da Fase 1
  console.log('\n\n📝 QUESTS DA FASE 1')
  console.log('-'.repeat(80))
  
  const { data: phase1Quests } = await supabase
    .from('quests')
    .select('*')
    .eq('phase_id', 1)
    .order('order_index', { ascending: true })
  
  if (phase1Quests) {
    for (const quest of phase1Quests) {
      console.log(`\nQuest ${quest.order_index}: ${quest.name}`)
      console.log(`  Status: ${quest.status}`)
      console.log(`  Duração planejada: ${quest.planned_deadline_minutes} min`)
      
      if (quest.started_at) {
        const start = new Date(quest.started_at)
        const end = new Date(start.getTime() + quest.planned_deadline_minutes * 60 * 1000)
        console.log(`  Iniciou: ${start.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
        console.log(`  Deveria terminar: ${end.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
      }
      
      if (quest.closed_at) {
        const closed = new Date(quest.closed_at)
        console.log(`  Fechou em: ${closed.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
      }
    }
  }

  // 3. Verificar event_config
  console.log('\n\n⚙️  EVENT CONFIG')
  console.log('-'.repeat(80))
  
  const { data: config } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()
  
  console.log(`Fase atual: ${config.current_phase}`)
  console.log(`Evento iniciado: ${config.event_started}`)
  console.log(`Evento terminado: ${config.event_ended}`)
  
  if (config.phase_1_start_time) {
    const p1Start = new Date(config.phase_1_start_time)
    const p1End = new Date(p1Start.getTime() + 150 * 60 * 1000) // 2h30min
    console.log(`\nFase 1:`)
    console.log(`  Iniciou: ${p1Start.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    console.log(`  Deveria terminar: ${p1End.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
  }
  
  if (config.phase_2_start_time) {
    const p2Start = new Date(config.phase_2_start_time)
    console.log(`\nFase 2:`)
    console.log(`  Iniciou: ${p2Start.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    
    // Calcular quando DEVERIA ter iniciado
    const p1Start = new Date(config.phase_1_start_time)
    const p2Expected = new Date(p1Start.getTime() + 150 * 60 * 1000)
    console.log(`  Deveria ter iniciado: ${p2Expected.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    
    const delay = (p2Start - p2Expected) / (1000 * 60)
    console.log(`  ⚠️  ATRASO: ${Math.round(delay)} minutos (${Math.floor(delay/60)}h ${Math.round(delay%60)}min)`)
  }

  // 4. Verificar última quest da Fase 1
  console.log('\n\n🎯 ÚLTIMA QUEST DA FASE 1 (CRÍTICO PARA AUTO-ADVANCE)')
  console.log('-'.repeat(80))
  
  const { data: lastQuest } = await supabase
    .from('quests')
    .select('*')
    .eq('phase_id', 1)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()
  
  if (lastQuest) {
    console.log(`Quest: ${lastQuest.name}`)
    console.log(`Status: ${lastQuest.status}`)
    console.log(`Planned deadline: ${lastQuest.planned_deadline_minutes} min`)
    
    if (lastQuest.started_at) {
      const start = new Date(lastQuest.started_at)
      const plannedEnd = new Date(start.getTime() + lastQuest.planned_deadline_minutes * 60 * 1000)
      
      console.log(`\nStarted at: ${start.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
      console.log(`Planned deadline: ${plannedEnd.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
      
      if (lastQuest.closed_at) {
        const closed = new Date(lastQuest.closed_at)
        console.log(`Closed at: ${closed.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
        
        const timeBetween = (closed - plannedEnd) / (1000 * 60)
        if (timeBetween > 5) {
          console.log(`⚠️  Quest fechou ${Math.round(timeBetween)} minutos DEPOIS do deadline`)
        } else if (timeBetween < -5) {
          console.log(`⚠️  Quest fechou ${Math.round(Math.abs(timeBetween))} minutos ANTES do deadline`)
        } else {
          console.log(`✅ Quest fechou no horário correto`)
        }
      } else {
        console.log(`❌ Quest NUNCA FOI FECHADA! (closed_at is NULL)`)
        console.log(`   Isso impede o auto-advance!`)
      }
    }
  }

  // 5. Verificar próxima quest (primeira da Fase 2)
  console.log('\n\n🔜 PRIMEIRA QUEST DA FASE 2')
  console.log('-'.repeat(80))
  
  const { data: firstQuestP2 } = await supabase
    .from('quests')
    .select('*')
    .eq('phase_id', 2)
    .order('order_index', { ascending: true })
    .limit(1)
    .single()
  
  if (firstQuestP2) {
    console.log(`Quest: ${firstQuestP2.name}`)
    console.log(`Status: ${firstQuestP2.status}`)
    
    if (firstQuestP2.started_at) {
      const start = new Date(firstQuestP2.started_at)
      console.log(`Started at: ${start.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
      
      // Quando deveria ter começado?
      const p1Start = new Date(config.phase_1_start_time)
      const expected = new Date(p1Start.getTime() + 150 * 60 * 1000)
      console.log(`Expected start: ${expected.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
      
      const delay = (start - expected) / (1000 * 60)
      console.log(`Delay: ${Math.round(delay)} minutos`)
    } else {
      console.log(`❌ Ainda não foi iniciada`)
    }
  }

  // 6. DIAGNÓSTICO
  console.log('\n\n🔬 DIAGNÓSTICO AUTOMÁTICO')
  console.log('-'.repeat(80))
  
  const issues = []
  
  // Verificar se última quest da fase 1 foi fechada
  if (lastQuest && !lastQuest.closed_at) {
    issues.push({
      severity: 'CRÍTICO',
      problema: 'Última quest da Fase 1 nunca foi fechada (closed_at = NULL)',
      causa: 'O auto-advance depende de quest.closed_at para saber quando avançar',
      solução: 'Verificar se QuestAutoAdvancer.tsx está fechando quests corretamente'
    })
  }
  
  // Verificar se quest fechou muito depois do deadline
  if (lastQuest && lastQuest.closed_at && lastQuest.started_at) {
    const start = new Date(lastQuest.started_at)
    const plannedEnd = new Date(start.getTime() + lastQuest.planned_deadline_minutes * 60 * 1000)
    const closed = new Date(lastQuest.closed_at)
    const delayMinutes = (closed - plannedEnd) / (1000 * 60)
    
    if (delayMinutes > 60) {
      issues.push({
        severity: 'ALTO',
        problema: `Última quest fechou ${Math.round(delayMinutes)} minutos DEPOIS do deadline`,
        causa: 'QuestAutoAdvancer pode não estar rodando ou teve falha',
        solução: 'Verificar logs do QuestAutoAdvancer no browser console'
      })
    }
  }
  
  // Verificar se Fase 2 demorou demais para começar
  if (config.phase_1_start_time && config.phase_2_start_time) {
    const p1Start = new Date(config.phase_1_start_time)
    const p2Start = new Date(config.phase_2_start_time)
    const p2Expected = new Date(p1Start.getTime() + 150 * 60 * 1000)
    const delayMinutes = (p2Start - p2Expected) / (1000 * 60)
    
    if (delayMinutes > 60) {
      issues.push({
        severity: 'CRÍTICO',
        problema: `Fase 2 começou ${Math.round(delayMinutes)} minutos DEPOIS do esperado`,
        causa: 'Auto-advance de fase não executou no horário',
        solução: 'pg_cron pode não estar ativo ou advance_to_next_phase() falhou'
      })
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ Nenhum problema detectado automaticamente')
  } else {
    issues.forEach((issue, i) => {
      console.log(`\n${i + 1}. [${issue.severity}] ${issue.problema}`)
      console.log(`   Causa provável: ${issue.causa}`)
      console.log(`   Solução: ${issue.solução}`)
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n💡 HIPÓTESES PRINCIPAIS')
  console.log('-'.repeat(80))
  console.log('1. QuestAutoAdvancer (frontend) não estava rodando')
  console.log('   - Precisa de uma aba aberta na live-dashboard')
  console.log('   - Se você fechou o browser, ele para de funcionar')
  console.log('')
  console.log('2. pg_cron (backend) não está configurado')
  console.log('   - Supabase free tier pode não ter pg_cron habilitado')
  console.log('   - Precisa configurar manualmente no Supabase Dashboard')
  console.log('')
  console.log('3. advance_to_next_phase() teve erro')
  console.log('   - Verificar logs do Supabase')
  console.log('   - Pode ter erro de permissão ou lógica')
}

investigateAutoAdvance()
