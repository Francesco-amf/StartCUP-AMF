const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function investigateTimezone() {
  console.log('\n🔍 INVESTIGAÇÃO DE TIMEZONE - UTC vs BRT\n')
  console.log('=' .repeat(80))
  
  const { data: config } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  console.log('\n📅 ANÁLISE DO HORÁRIO DE INÍCIO')
  console.log('-'.repeat(80))
  
  // Valor armazenado no banco (UTC)
  const dbValue = config.event_start_time
  console.log(`Valor no DB (string): ${dbValue}`)
  
  // Criar objeto Date a partir do valor do DB
  const dateFromDB = new Date(dbValue)
  console.log(`\nInterpretação do JavaScript:`)
  console.log(`  UTC:  ${dateFromDB.toISOString()}`)
  console.log(`  BRT:  ${dateFromDB.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
  
  // Você disse que começou às 02:05 BRT
  console.log(`\n\n✅ VOCÊ DISSE: "Começou às 02:05 da madrugada (horário de Brasília)"`)
  console.log('-'.repeat(80))
  
  // Criar data com 02:05 BRT de hoje
  const now = new Date()
  const yourTime = new Date(now)
  yourTime.setHours(2, 5, 0, 0)
  
  // Se 02:05 de hoje já passou (estamos em 12:14), foi hoje mesmo
  // Se não passou, foi ontem
  if (yourTime > now) {
    yourTime.setDate(yourTime.getDate() - 1)
  }
  
  console.log(`02:05 BRT do dia ${yourTime.toLocaleDateString('pt-BR')}:`)
  console.log(`  BRT: ${yourTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
  
  // Converter 02:05 BRT para UTC manualmente
  // BRT = UTC-3
  const yourTimeUTC = new Date(yourTime.getTime() + 3 * 60 * 60 * 1000)
  console.log(`  UTC: ${yourTimeUTC.toISOString()}`)
  
  console.log(`\n\n🔍 COMPARAÇÃO`)
  console.log('-'.repeat(80))
  console.log(`O que você disse (02:05 BRT):`)
  console.log(`  BRT: ${yourTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
  console.log(`  UTC: ${yourTimeUTC.toISOString()}`)
  
  console.log(`\nO que está no banco de dados:`)
  console.log(`  BRT: ${dateFromDB.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
  console.log(`  UTC: ${dateFromDB.toISOString()}`)
  
  const diffMinutes = Math.round((dateFromDB - yourTimeUTC) / (1000 * 60))
  console.log(`\n⚠️  DIFERENÇA: ${diffMinutes} minutos`)
  
  if (Math.abs(diffMinutes) <= 5) {
    console.log(`✅ HORÁRIOS BATEM! (diferença aceitável de ${diffMinutes} min)`)
  } else {
    console.log(`❌ PROBLEMA ENCONTRADO!`)
    console.log(`   O banco mostra ${Math.abs(diffMinutes)} minutos de diferença`)
    console.log(`   Isso é ${Math.floor(Math.abs(diffMinutes) / 60)}h ${Math.abs(diffMinutes) % 60}min`)
  }

  console.log('\n\n📊 VERIFICAÇÃO COMPLETA DE TODAS AS FASES')
  console.log('-'.repeat(80))
  
  const fasesDuracao = [
    { fase: 1, nome: 'Descoberta', duracao: 150 },
    { fase: 2, nome: 'Criação', duracao: 210 },
    { fase: 3, nome: 'Estratégia', duracao: 150 },
    { fase: 4, nome: 'Refinamento', duracao: 120 },
    { fase: 5, nome: 'Pitch Final', duracao: 90 }
  ]
  
  // Começando às 02:05 BRT (o que você disse)
  let tempoAcumulado = 0
  console.log(`\nSE O EVENTO REALMENTE COMEÇOU ÀS 02:05 BRT:\n`)
  
  for (const f of fasesDuracao) {
    const inicioPlanejado = new Date(yourTimeUTC.getTime() + tempoAcumulado * 60 * 1000)
    const fimPlanejado = new Date(inicioPlanejado.getTime() + f.duracao * 60 * 1000)
    
    console.log(`Fase ${f.fase} - ${f.nome}:`)
    console.log(`  Deveria iniciar: ${inicioPlanejado.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`)
    console.log(`  Deveria terminar: ${fimPlanejado.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`)
    
    // Ver o que está no DB
    const dbStartField = `phase_${f.fase}_start_time`
    if (config[dbStartField]) {
      const dbStart = new Date(config[dbStartField])
      console.log(`  Iniciou no DB:    ${dbStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`)
      
      const diffMin = Math.round((dbStart - inicioPlanejado) / (1000 * 60))
      if (diffMin !== 0) {
        console.log(`  ⚠️  Diferença: ${diffMin > 0 ? '+' : ''}${diffMin} minutos`)
      } else {
        console.log(`  ✅ No horário!`)
      }
    } else {
      console.log(`  (ainda não iniciou)`)
    }
    console.log()
    
    tempoAcumulado += f.duracao
  }
  
  const fimTotalPlanejado = new Date(yourTimeUTC.getTime() + (tempoAcumulado + 20) * 60 * 1000)
  console.log(`FIM TOTAL DO EVENTO (com 20min avaliação):`)
  console.log(`  ${fimTotalPlanejado.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`)
  
  const agoraAgora = new Date()
  console.log(`\n\n⏰ SITUAÇÃO ATUAL`)
  console.log('-'.repeat(80))
  console.log(`Agora: ${agoraAgora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`)
  console.log(`Fase atual no DB: ${config.current_phase}`)
  
  if (config.current_phase > 0 && config.current_phase <= 5) {
    const faseAtual = fasesDuracao[config.current_phase - 1]
    const dbStartField = `phase_${config.current_phase}_start_time`
    const faseStart = new Date(config[dbStartField])
    const faseEnd = new Date(faseStart.getTime() + faseAtual.duracao * 60 * 1000)
    
    const minRestantes = Math.round((faseEnd - agoraAgora) / (1000 * 60))
    
    console.log(`\nFase ${config.current_phase} (${faseAtual.nome}):`)
    console.log(`  Iniciou: ${faseStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    console.log(`  Termina: ${faseEnd.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    console.log(`  Tempo restante: ${Math.floor(minRestantes / 60)}h ${minRestantes % 60}min`)
    
    console.log(`\n  Você disse que faltam ~30 minutos`)
    console.log(`  O cálculo mostra: ${minRestantes} minutos`)
    
    if (Math.abs(minRestantes - 30) > 10) {
      console.log(`\n  ⚠️  DISCREPÂNCIA DE ${Math.abs(minRestantes - 30)} minutos!`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n🎯 CONCLUSÃO')
  console.log('-'.repeat(80))
  
  if (Math.abs(diffMinutes) > 60) {
    console.log('❌ PROBLEMA DE TIMEZONE DETECTADO!')
    console.log(`   O horário no banco está ${Math.floor(Math.abs(diffMinutes) / 60)}h ${Math.abs(diffMinutes) % 60}min diferente`)
    console.log(`   do que você disse (02:05 BRT)`)
    console.log(`\n   Possíveis causas:`)
    console.log(`   1. Banco armazenou em timezone errado`)
    console.log(`   2. Conversão BRT→UTC foi feita incorretamente`)
    console.log(`   3. O evento realmente começou em horário diferente`)
  } else {
    console.log('✅ Timezone está OK!')
    console.log('   O problema pode ser outra coisa (auto-advance, delays, etc)')
  }
}

investigateTimezone()
