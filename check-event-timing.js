const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkEventTiming() {
  console.log('🔍 VERIFICAÇÃO DE TIMING DO EVENTO\n')
  console.log('=' .repeat(80))
  
  // Horário atual
  const now = new Date()
  console.log(`\n⏰ HORÁRIO ATUAL: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
  console.log(`   UTC: ${now.toISOString()}`)
  
  // Buscar configuração do evento
  const { data: eventConfig, error: configError } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  if (configError) {
    console.error('❌ Erro ao buscar event_config:', configError)
    return
  }

  console.log('\n' + '=' .repeat(80))
  console.log('📋 CONFIGURAÇÃO DO EVENTO')
  console.log('=' .repeat(80))
  console.log(`Evento iniciado: ${eventConfig.event_started}`)
  console.log(`Fase atual: ${eventConfig.current_phase}`)
  
  if (eventConfig.event_start_time) {
    const startTime = new Date(eventConfig.event_start_time)
    console.log(`\n🚀 Início do evento: ${startTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    console.log(`   UTC: ${startTime.toISOString()}`)
    
    const elapsedMs = now - startTime
    const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60))
    const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))
    console.log(`\n⏱️  TEMPO DECORRIDO: ${elapsedHours}h ${elapsedMinutes}min`)
  }

  // Buscar todas as fases e suas durações
  console.log('\n' + '=' .repeat(80))
  console.log('📊 DURAÇÕES DAS FASES (configuradas)')
  console.log('=' .repeat(80))
  
  const phaseDurations = {
    1: 150, // 2h30min
    2: 210, // 3h30min
    3: 150, // 2h30min
    4: 120, // 2h
    5: 90   // 1h30min
  }
  
  let totalDuration = 0
  for (let i = 1; i <= 5; i++) {
    const duration = phaseDurations[i]
    totalDuration += duration
    console.log(`Fase ${i}: ${duration} minutos (${Math.floor(duration / 60)}h ${duration % 60}min)`)
  }
  
  console.log(`\n✅ DURAÇÃO TOTAL PLANEJADA: ${totalDuration} minutos = ${Math.floor(totalDuration / 60)}h ${totalDuration % 60}min`)
  console.log(`   + 20 minutos de avaliação final`)
  console.log(`   = ${totalDuration + 20} minutos TOTAL (${Math.floor((totalDuration + 20) / 60)}h ${(totalDuration + 20) % 60}min)`)

  // Verificar timestamps das fases
  console.log('\n' + '=' .repeat(80))
  console.log('🕐 TIMESTAMPS DAS FASES (banco de dados)')
  console.log('=' .repeat(80))
  
  for (let i = 1; i <= 5; i++) {
    const startField = `phase_${i}_start_time`
    if (eventConfig[startField]) {
      const phaseStart = new Date(eventConfig[startField])
      console.log(`\nFase ${i}:`)
      console.log(`  Início: ${phaseStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
      console.log(`  UTC: ${phaseStart.toISOString()}`)
      
      if (eventConfig.event_start_time) {
        const eventStart = new Date(eventConfig.event_start_time)
        const diffMs = phaseStart - eventStart
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        console.log(`  Tempo desde início do evento: ${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}min`)
      }
      
      // Calcular quando a fase deveria terminar
      const phaseDuration = phaseDurations[i]
      const phaseEnd = new Date(phaseStart.getTime() + phaseDuration * 60 * 1000)
      console.log(`  Fim previsto: ${phaseEnd.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
      
      const timeUntilEnd = phaseEnd - now
      const minutesLeft = Math.floor(timeUntilEnd / (1000 * 60))
      if (minutesLeft > 0) {
        console.log(`  ⏱️  Faltam: ${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}min`)
      } else {
        console.log(`  ⚠️  Deveria ter terminado há: ${Math.floor(Math.abs(minutesLeft) / 60)}h ${Math.abs(minutesLeft) % 60}min`)
      }
    }
  }

  // Calcular horário de término esperado
  if (eventConfig.event_start_time) {
    const eventStart = new Date(eventConfig.event_start_time)
    const expectedEnd = new Date(eventStart.getTime() + (totalDuration + 20) * 60 * 1000)
    
    console.log('\n' + '=' .repeat(80))
    console.log('🏁 PREVISÃO DE TÉRMINO')
    console.log('=' .repeat(80))
    console.log(`Término esperado: ${expectedEnd.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    console.log(`UTC: ${expectedEnd.toISOString()}`)
    
    const timeUntilEnd = expectedEnd - now
    const hoursLeft = Math.floor(timeUntilEnd / (1000 * 60 * 60))
    const minutesLeft = Math.floor((timeUntilEnd % (1000 * 60 * 60)) / (1000 * 60))
    
    if (timeUntilEnd > 0) {
      console.log(`\n⏱️  FALTAM: ${hoursLeft}h ${minutesLeft}min`)
    } else {
      console.log(`\n⚠️  JÁ PASSOU: ${Math.abs(hoursLeft)}h ${Math.abs(minutesLeft)}min`)
    }
  }

  // Buscar quest atual
  console.log('\n' + '=' .repeat(80))
  console.log('📝 QUEST ATUAL')
  console.log('=' .repeat(80))
  
  const { data: activeQuest } = await supabase
    .from('quests')
    .select('*')
    .eq('status', 'active')
    .single()

  if (activeQuest) {
    console.log(`Nome: ${activeQuest.name}`)
    console.log(`Fase: ${activeQuest.phase_id}`)
    console.log(`Duração planejada: ${activeQuest.planned_deadline_minutes} minutos`)
    
    if (activeQuest.started_at) {
      const questStart = new Date(activeQuest.started_at)
      console.log(`Início: ${questStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
      
      const questEnd = new Date(questStart.getTime() + activeQuest.planned_deadline_minutes * 60 * 1000)
      console.log(`Fim previsto: ${questEnd.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
      
      const timeLeft = questEnd - now
      const minutesLeft = Math.floor(timeLeft / (1000 * 60))
      const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000)
      
      if (timeLeft > 0) {
        console.log(`⏱️  Tempo restante: ${minutesLeft}min ${secondsLeft}s`)
      } else {
        console.log(`⚠️  Deveria ter terminado há: ${Math.abs(minutesLeft)}min ${Math.abs(secondsLeft)}s`)
      }
    }
  }

  console.log('\n' + '=' .repeat(80))
}

checkEventTiming()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro:', err)
    process.exit(1)
  })
