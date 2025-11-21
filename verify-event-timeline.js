const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyTimeline() {
  console.log('\n📊 VERIFICAÇÃO DE TIMELINE DO EVENTO\n')
  console.log('=' .repeat(80))
  
  // Buscar event_config
  const { data: config, error } = await supabase
    .from('event_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  if (error) {
    console.error('❌ Erro:', error)
    return
  }

  const now = new Date()
  
  console.log('\n🕐 HORÁRIO ATUAL')
  console.log('-'.repeat(80))
  console.log(`Agora: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (BRT)`)
  console.log(`UTC:   ${now.toISOString()}`)

  console.log('\n📅 INÍCIO DO EVENTO')
  console.log('-'.repeat(80))
  const eventStart = new Date(config.event_start_time)
  console.log(`Iniciado em: ${eventStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (BRT)`)
  console.log(`UTC:         ${eventStart.toISOString()}`)
  
  const tempoDecorrido = now - eventStart
  const horasDecorridas = Math.floor(tempoDecorrido / (1000 * 60 * 60))
  const minutosDecorridos = Math.floor((tempoDecorrido % (1000 * 60 * 60)) / (1000 * 60))
  console.log(`⏱️  Tempo desde início: ${horasDecorridas}h ${minutosDecorridos}min`)

  console.log('\n📝 FASES E SUAS DURAÇÕES PLANEJADAS')
  console.log('-'.repeat(80))
  const fasesDuracao = [
    { fase: 1, nome: 'Descoberta', duracao: 150 },      // 2h30min
    { fase: 2, nome: 'Criação', duracao: 210 },         // 3h30min
    { fase: 3, nome: 'Estratégia', duracao: 150 },      // 2h30min
    { fase: 4, nome: 'Refinamento', duracao: 120 },     // 2h
    { fase: 5, nome: 'Pitch Final', duracao: 90 }       // 1h30min
  ]

  let tempoAcumulado = 0
  const timeline = []
  
  fasesDuracao.forEach(f => {
    const inicio = new Date(eventStart.getTime() + tempoAcumulado * 60 * 1000)
    const fim = new Date(inicio.getTime() + f.duracao * 60 * 1000)
    
    timeline.push({
      ...f,
      inicio,
      fim,
      tempoAcumuladoInicio: tempoAcumulado,
      tempoAcumuladoFim: tempoAcumulado + f.duracao
    })
    
    console.log(`Fase ${f.fase} - ${f.nome}:`)
    console.log(`  Duração: ${f.duracao} min (${Math.floor(f.duracao/60)}h ${f.duracao%60}min)`)
    console.log(`  Início:  ${inicio.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    console.log(`  Fim:     ${fim.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    console.log()
    
    tempoAcumulado += f.duracao
  })

  const duracaoTotalEvento = tempoAcumulado
  const fimEventoPlanejado = new Date(eventStart.getTime() + duracaoTotalEvento * 60 * 1000)
  const fimEventoComAvaliacao = new Date(fimEventoPlanejado.getTime() + 20 * 60 * 1000)

  console.log('📊 RESUMO TOTAL')
  console.log('-'.repeat(80))
  console.log(`Duração total das fases: ${duracaoTotalEvento} min (${Math.floor(duracaoTotalEvento/60)}h ${duracaoTotalEvento%60}min)`)
  console.log(`Fim das fases (planejado): ${fimEventoPlanejado.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
  console.log(`+ 20 min de avaliação final`)
  console.log(`Fim total do evento: ${fimEventoComAvaliacao.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)

  console.log('\n🎯 FASE ATUAL')
  console.log('-'.repeat(80))
  console.log(`Fase atual no DB: ${config.current_phase}`)
  
  if (config.current_phase > 0 && config.current_phase <= 5) {
    const faseAtual = timeline[config.current_phase - 1]
    const inicioFaseAtual = new Date(config[`phase_${config.current_phase}_start_time`])
    const fimPlanejadoFaseAtual = new Date(inicioFaseAtual.getTime() + faseAtual.duracao * 60 * 1000)
    
    console.log(`Fase ${config.current_phase} - ${faseAtual.nome}`)
    console.log(`Iniciou em (DB):  ${inicioFaseAtual.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    console.log(`Deveria iniciar:  ${faseAtual.inicio.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    
    const diferencaInicio = inicioFaseAtual - faseAtual.inicio
    const minutosDiferenca = Math.round(diferencaInicio / (1000 * 60))
    if (minutosDiferenca !== 0) {
      console.log(`⚠️  DIFERENÇA: ${minutosDiferenca > 0 ? '+' : ''}${minutosDiferenca} minutos`)
    } else {
      console.log(`✅ Iniciou no horário correto!`)
    }
    
    const tempoRestante = fimPlanejadoFaseAtual - now
    const minutosRestantes = Math.floor(tempoRestante / (1000 * 60))
    const segundosRestantes = Math.floor((tempoRestante % (1000 * 60)) / 1000)
    
    console.log(`\nTérmino previsto: ${fimPlanejadoFaseAtual.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    console.log(`Tempo restante: ${minutosRestantes}min ${segundosRestantes}s`)
  }

  console.log('\n🔍 VERIFICAÇÃO DAS SUAS INFORMAÇÕES')
  console.log('-'.repeat(80))
  console.log('Você disse:')
  console.log('  - Iniciou: ~02:05 (madrugada)')
  console.log('  - Agora: 12:08')
  console.log('  - Fase atual: 2')
  console.log('  - Tempo restante Fase 2: ~30 minutos')
  console.log('  - Fim esperado do evento: ~14:25')
  console.log()
  
  // Calcular baseado nas suas informações
  const seuInicio = new Date(now)
  seuInicio.setHours(2, 5, 0, 0)
  if (seuInicio > now) {
    seuInicio.setDate(seuInicio.getDate() - 1) // Foi ontem de madrugada
  }
  
  const seuFimEsperado = new Date(seuInicio.getTime() + duracaoTotalEvento * 60 * 1000 + 20 * 60 * 1000)
  
  console.log('Cálculo baseado em início às 02:05:')
  console.log(`  Fim esperado: ${seuFimEsperado.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
  console.log()
  
  const fimRealDB = new Date(eventStart.getTime() + duracaoTotalEvento * 60 * 1000 + 20 * 60 * 1000)
  console.log('Fim real baseado no DB:')
  console.log(`  ${fimRealDB.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)

  console.log('\n✅ VERIFICAÇÃO FINAL')
  console.log('-'.repeat(80))
  
  const inicioReal = new Date(config.event_start_time)
  const inicioEsperado = seuInicio
  const diferencaInicioMinutos = Math.round((inicioReal - inicioEsperado) / (1000 * 60))
  
  if (Math.abs(diferencaInicioMinutos) <= 5) {
    console.log(`✅ Horário de início está correto (diferença: ${diferencaInicioMinutos} min)`)
  } else {
    console.log(`⚠️  ATENÇÃO: Diferença de ${diferencaInicioMinutos} minutos no início`)
    console.log(`   Esperado: ${inicioEsperado.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    console.log(`   Real DB:  ${inicioReal.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
  }
  
  if (config.current_phase === 2) {
    console.log(`✅ Fase atual correta: Fase 2`)
    
    const fase2 = timeline[1]
    const fase2InicioReal = new Date(config.phase_2_start_time)
    const fase2FimPrevisto = new Date(fase2InicioReal.getTime() + fase2.duracao * 60 * 1000)
    const minutosRestantesFase2 = Math.round((fase2FimPrevisto - now) / (1000 * 60))
    
    console.log(`   Tempo restante Fase 2: ${minutosRestantesFase2} minutos`)
    if (Math.abs(minutosRestantesFase2 - 30) <= 5) {
      console.log(`   ✅ Bate com seus ~30 minutos!`)
    } else {
      console.log(`   ⚠️  Você disse ~30 min, mas cálculo mostra ${minutosRestantesFase2} min`)
    }
  }

  console.log('\n' + '='.repeat(80))
}

verifyTimeline()
