'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'

interface Quest {
  id: string
  order_index: number
  name: string
  description: string
  max_points: number
  deliverable_type: string
  status: string
  duration_minutes: number
}

interface CurrentQuestTimerProps {
  phase: number
  phaseStartedAt: string
  phaseDurationMinutes: number
}

// Fallback quest data para fases sem quests no banco
const PHASES_QUESTS_FALLBACK: Record<number, Quest[]> = {
  1: [
    {
      id: 'f-1-1',
      order_index: 1,
      name: 'Conhecendo o Terreno',
      description: 'Análise do mercado através de TAM/SAM/SOM',
      max_points: 100,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 60
    },
    {
      id: 'f-1-2',
      order_index: 2,
      name: 'A Persona Secreta',
      description: 'Definir o público-alvo da startup',
      max_points: 50,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 50
    },
    {
      id: 'f-1-3',
      order_index: 3,
      name: 'Construindo Pontes',
      description: 'Estratégia de relacionamento e distribuição',
      max_points: 50,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 30
    }
  ],
  2: [
    {
      id: 'f-2-1',
      order_index: 1,
      name: 'A Grande Ideia',
      description: 'Proposta de valor única + Business Model Canvas',
      max_points: 100,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 50
    },
    {
      id: 'f-2-2',
      order_index: 2,
      name: 'Identidade Secreta',
      description: 'Nome e logotipo da startup',
      max_points: 50,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 30
    },
    {
      id: 'f-2-3',
      order_index: 3,
      name: 'Prova de Conceito',
      description: 'Protótipo navegável da solução',
      max_points: 150,
      deliverable_type: 'url',
      status: 'scheduled',
      duration_minutes: 120
    }
  ],
  3: [
    {
      id: 'f-3-1',
      order_index: 1,
      name: 'Montando o Exército',
      description: 'Atividades-chave e recursos necessários',
      max_points: 50,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 40
    },
    {
      id: 'f-3-2',
      order_index: 2,
      name: 'Aliados Estratégicos',
      description: 'Definir 2 parceiros-chave',
      max_points: 50,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 30
    },
    {
      id: 'f-3-3',
      order_index: 3,
      name: 'Show Me The Money',
      description: 'Estrutura de custos e receitas',
      max_points: 100,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 70
    }
  ],
  4: [
    {
      id: 'f-4-1',
      order_index: 1,
      name: 'Teste de Fogo',
      description: 'Simular uso do produto e melhorias',
      max_points: 50,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 40
    },
    {
      id: 'f-4-2',
      order_index: 2,
      name: 'Validação de Mercado',
      description: 'Pesquisa rápida com 5+ pessoas',
      max_points: 50,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 40
    },
    {
      id: 'f-4-3',
      order_index: 3,
      name: 'Números que Convencem',
      description: 'Refinar projeções financeiras',
      max_points: 50,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 30
    }
  ],
  5: [
    {
      id: 'f-5-1',
      order_index: 1,
      name: 'A História Épica',
      description: 'Estruturar narrativa do pitch (5 minutos)',
      max_points: 75,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 20
    },
    {
      id: 'f-5-2',
      order_index: 2,
      name: 'Slides de Impacto',
      description: 'Criar apresentação visual',
      max_points: 50,
      deliverable_type: 'url',
      status: 'scheduled',
      duration_minutes: 40
    },
    {
      id: 'f-5-3',
      order_index: 3,
      name: 'Ensaio Geral',
      description: 'Treinar pitch e ajustar timing',
      max_points: 25,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 30
    }
  ]
}

export default function CurrentQuestTimer({
  phase,
  phaseStartedAt,
  phaseDurationMinutes
}: CurrentQuestTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
    percentage: number
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    percentage: 100
  })

  const [quests, setQuests] = useState<Quest[]>([])
  const [loadingQuests, setLoadingQuests] = useState(true)
  const supabase = createClient()

  // Carregar quests da fase atual do banco de dados
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        // Primeiro, buscar o ID da fase atual
        const { data: phaseData, error: phaseError } = await supabase
          .from('phases')
          .select('id')
          .eq('order_index', phase)
          .single()

        if (phaseError || !phaseData) {
          console.error('Erro ao buscar fase:', phaseError)
          setQuests(PHASES_QUESTS_FALLBACK[phase] || [])
          setLoadingQuests(false)
          return
        }

        console.log(`🔍 Buscando quests para Fase ${phase} (phase_id: ${phaseData.id})`)

        // Agora buscar quests APENAS dessa fase
        const { data, error } = await supabase
          .from('quests')
          .select(`
            id,
            order_index,
            name,
            description,
            max_points,
            deliverable_type,
            status,
            duration_minutes
          `)
          .eq('phase_id', phaseData.id)
          .in('status', ['scheduled', 'active'])
          .order('order_index')

        if (error) {
          console.error(`❌ Erro ao buscar quests para Fase ${phase}:`, error)
        }

        console.log(`📊 Resultado da query - Total de quests: ${data?.length || 0}`, data)

        // Fallback data para comparação
        const expectedFallbackQuestCount = PHASES_QUESTS_FALLBACK[phase]?.length || 0
        const hasInsufficientQuests = data && data.length < expectedFallbackQuestCount

        if (!error && data && data.length > 0 && !hasInsufficientQuests) {
          // Ordenar por order_index para garantir ordem correta
          const sortedData = [...data].sort((a: any, b: any) => a.order_index - b.order_index)

          // Remapear order_index para ser local da fase (1, 2, 3...)
          const normalizedQuests = sortedData.map((q: any, idx: number) => ({
            ...q,
            order_index: idx + 1
          }))

          console.log(`✅ Quests carregadas para Fase ${phase}:`, normalizedQuests.map((q: any) => `[${q.order_index}] ${q.name}`))
          setQuests(normalizedQuests)
        } else {
          // Usar fallback se não houver quests no banco para essa fase OU se houver menos quests do que esperado
          if (hasInsufficientQuests) {
            console.log(`⚠️ Fase ${phase} tem apenas ${data?.length} quests na DB (esperado ${expectedFallbackQuestCount}), usando fallback`)
          } else {
            console.log(`⚠️ Nenhuma quest encontrada para Fase ${phase} (ou erro na query), usando fallback`)
          }
          const fallbackQuests = PHASES_QUESTS_FALLBACK[phase] || []
          // Normalizar fallback também para garantir consistência
          const normalizedFallback = fallbackQuests.map((q: any, idx: number) => ({
            ...q,
            order_index: idx + 1
          }))
          console.log(`📋 Fallback quests para Fase ${phase}:`, normalizedFallback.map((q: any) => `[${q.order_index}] ${q.name}`))
          setQuests(normalizedFallback)
        }
      } catch (err) {
        console.error('Erro ao carregar quests:', err)
        // Usar fallback em caso de erro
        const fallbackQuests = PHASES_QUESTS_FALLBACK[phase] || []
        const normalizedFallback = fallbackQuests.map((q, idx) => ({
          ...q,
          order_index: idx + 1
        }))
        setQuests(normalizedFallback)
      } finally {
        setLoadingQuests(false)
      }
    }

    setLoadingQuests(true)
    fetchQuests()
  }, [phase, supabase])

  const questCount = quests.length

  // ✅ CORRIGIDO: Usar duration_minutes individual de cada quest, não dividir a fase
  // Cada quest tem sua própria duração conforme documentação oficial
  const getQuestDurationMs = (questIndex: number): number => {
    const quest = quests[questIndex]
    if (quest && quest.duration_minutes > 0) {
      // Se a quest tem duration_minutes definido, usar esse valor
      return quest.duration_minutes * 60 * 1000
    }
    // Fallback: dividir duração da fase igualmente (comportamento antigo)
    return (phaseDurationMinutes / (questCount || 1)) * 60 * 1000
  }

  const timePerQuest = getQuestDurationMs(0) // Será recalculado para cada quest

  useEffect(() => {
    const calculateTimeLeft = () => {
      // ⚠️ SAFETY CHECK: Handle NULL/undefined phaseStartedAt
      if (!phaseStartedAt) {
        console.warn(`⚠️ WARNING: phaseStartedAt is null or undefined for Phase ${phase}`)
        console.warn('   This means phase_X_start_time is not set in event_config')
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          percentage: 0
        })
        return
      }

      // ⚠️ CRÍTICO: phaseStartedAt pode vir SEM Z do Supabase
      // Se não tem Z, adicionar para forçar interpretação como UTC
      const ensureZFormat = phaseStartedAt.endsWith('Z')
        ? phaseStartedAt
        : `${phaseStartedAt}Z`

      const startTime = new Date(ensureZFormat).getTime()

      // ⚠️ SAFETY CHECK: Ensure startTime is valid (not NaN)
      if (isNaN(startTime)) {
        console.error(`❌ ERROR: Could not parse phaseStartedAt timestamp for Phase ${phase}:`, phaseStartedAt)
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          percentage: 0
        })
        return
      }

      const now = new Date().getTime()
      const elapsed = now - startTime
      const totalDuration = phaseDurationMinutes * 60 * 1000

      console.log(`⏱️ CurrentQuestTimer - Phase ${phase}:`)
      console.log(`   - phaseStartedAt (raw): ${phaseStartedAt}`)
      console.log(`   - with Z: ${ensureZFormat}`)
      console.log(`   - startTime (ms): ${startTime}`)
      console.log(`   - now (ms): ${now}`)
      console.log(`   - elapsed: ${(elapsed / 1000 / 60).toFixed(1)} minutes`)
      console.log(`   - totalDuration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`)

      if (elapsed >= totalDuration) {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          percentage: 0
        })
        return
      }

      const timeRemaining = totalDuration - elapsed
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)
      const percentage = Math.round((timeRemaining / totalDuration) * 100)

      console.log(`   - timeRemaining (ms): ${timeRemaining}`)
      console.log(`   - timeRemaining: ${hours}h ${minutes}m ${seconds}s`)

      setTimeLeft({
        hours,
        minutes,
        seconds,
        percentage
      })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [phaseStartedAt, phaseDurationMinutes, phase])

  const formatNumber = (num: number) => String(num).padStart(2, '0')

  // Determine which quest is current based on time elapsed
  // ⚠️ CRÍTICO: Adicionar Z se não existir
  const ensureZForQuest = phaseStartedAt.endsWith('Z')
    ? phaseStartedAt
    : `${phaseStartedAt}Z`
  const elapsedSeconds = Math.floor(
    (new Date().getTime() -
      new Date(ensureZForQuest).getTime()) / 1000
  )

  // ✅ CORRIGIDO: Calcular qual quest está ativa com base nas durações individuais
  let currentQuestIndex = 0
  let timeInCurrentQuest = elapsedSeconds
  let questTimeRemaining = 0

  for (let i = 0; i < quests.length; i++) {
    const questDurationSeconds = getQuestDurationMs(i) / 1000
    if (timeInCurrentQuest < questDurationSeconds) {
      currentQuestIndex = i
      questTimeRemaining = questDurationSeconds - timeInCurrentQuest
      break
    }
    timeInCurrentQuest -= questDurationSeconds
  }

  // Garantir que currentQuestIndex nunca ultrapassa quests.length - 1
  currentQuestIndex = Math.min(Math.max(0, currentQuestIndex), Math.max(0, quests.length - 1))

  const currentQuest = quests[currentQuestIndex] || quests[0]

  // Debug logging (apenas na primeira renderização após carregar quests)
  if (quests.length > 0 && Math.random() < 0.05) {
    const currentQuestDurationSeconds = getQuestDurationMs(currentQuestIndex) / 1000
    console.log(`[Timer] Fase ${phase}: elapsed=${elapsedSeconds}s, currentQuestDuration=${Math.round(currentQuestDurationSeconds)}s, currentIndex=${currentQuestIndex}, currentQuest=${currentQuest?.name}`)
  }

  const getProgressColor = () => {
    if (timeLeft.percentage > 66) return 'bg-green-500'
    if (timeLeft.percentage > 33) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loadingQuests) {
    return (
      <Card className="p-4 md:p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 text-white">
        <p className="text-center text-[#00E5FF]">Carregando dados das quests...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Quest Atual */}
      {currentQuest && (
        <Card className={`p-4 md:p-6 text-white overflow-hidden ${
          currentQuest.deliverable_type === 'presentation' || 
          (Array.isArray(currentQuest.deliverable_type) && currentQuest.deliverable_type.includes('presentation'))
            ? 'bg-gradient-to-r from-[#5A0A0A] to-[#3A0A0A] border-4 border-[#FF6B6B]'
            : 'bg-gradient-to-r from-indigo-500 to-purple-500'
        }`}>
          {/* Badge BOSS (se for apresentação) */}
          {(currentQuest.deliverable_type === 'presentation' || 
            (Array.isArray(currentQuest.deliverable_type) && currentQuest.deliverable_type.includes('presentation'))) && (
            <div className="absolute top-4 right-4 bg-[#FF6B6B] text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg animate-pulse">
              🔥 BOSS
            </div>
          )}
          
          <div className="space-y-3">
            <div>
              <p className={`text-xs md:text-sm font-semibold mb-1 ${
                currentQuest.deliverable_type === 'presentation' || 
                (Array.isArray(currentQuest.deliverable_type) && currentQuest.deliverable_type.includes('presentation'))
                  ? 'text-[#FF6B6B]'
                  : 'text-indigo-100'
              }`}>
                {currentQuest.deliverable_type === 'presentation' || 
                 (Array.isArray(currentQuest.deliverable_type) && currentQuest.deliverable_type.includes('presentation'))
                  ? `🎤 BOSS (${currentQuestIndex + 1}/${questCount})`
                  : `QUEST ATUAL (${currentQuestIndex + 1}/${questCount})`
                }
              </p>
              <h3 className={`text-lg md:text-2xl font-bold mb-1 truncate ${
                currentQuest.deliverable_type === 'presentation' || 
                (Array.isArray(currentQuest.deliverable_type) && currentQuest.deliverable_type.includes('presentation'))
                  ? 'text-[#FFD700]'
                  : 'text-white'
              }`}>
                {currentQuestIndex + 1}. {currentQuest.name}
              </h3>
              <p className={`text-sm md:text-base line-clamp-2 ${
                currentQuest.deliverable_type === 'presentation' || 
                (Array.isArray(currentQuest.deliverable_type) && currentQuest.deliverable_type.includes('presentation'))
                  ? 'text-[#FF6B6B]/80'
                  : 'text-indigo-100'
              }`}>
                {currentQuest.description}
              </p>
            </div>

            {/* Progress bar for quest */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs md:text-sm font-semibold">Tempo desta Quest</span>
                <span className="text-xs md:text-sm font-mono">
                  {Math.floor(questTimeRemaining / 60)}:{formatNumber(Math.floor(questTimeRemaining % 60))}
                </span>
              </div>
              <div className="w-full bg-[#0A1E47]/20 rounded-full h-2 md:h-3 overflow-hidden">
                <div
                  className="bg-[#0A1E47] h-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(0, (questTimeRemaining / (getQuestDurationMs(currentQuestIndex) / 1000)) * 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Points info */}
            <div className="flex justify-between items-center pt-2 border-t border-[#00E5FF]/40">
              <span className="text-xs md:text-sm">Pontos desta Quest</span>
              <span className="text-lg md:text-xl font-bold">{currentQuest.max_points} pts</span>
            </div>
          </div>
        </Card>
      )}

      {/* Total Phase Time */}
      <Card className="p-4 md:p-6 bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 text-white overflow-visible border-2 border-[#00E5FF]/40">
        <div className="space-y-4">
          <div>
            <p className="text-xs md:text-sm font-semibold text-[#00E5FF] mb-3">⏱️ TEMPO TOTAL DA FASE</p>

            {/* Timer Numbers - Escala fluida com CSS clamp */}
            <div
              className="flex items-center justify-center gap-0 font-bold font-mono leading-none"
              style={{
                fontSize: 'clamp(1.5rem, 8vw, 2.5rem)',
              }}
            >
              {/* Horas */}
              <div className="flex flex-col items-center min-w-max">
                <span className="leading-tight">{formatNumber(timeLeft.hours)}</span>
                <span className="font-normal mt-0.5" style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}>h</span>
              </div>

              {/* Separador */}
              <span className="leading-tight" style={{ padding: 'clamp(0.25rem, 1vw, 1rem)' }}>:</span>

              {/* Minutos */}
              <div className="flex flex-col items-center min-w-max">
                <span className="leading-tight">{formatNumber(timeLeft.minutes)}</span>
                <span className="font-normal mt-0.5" style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}>m</span>
              </div>

              {/* Separador */}
              <span className="leading-tight" style={{ padding: 'clamp(0.25rem, 1vw, 1rem)' }}>:</span>

              {/* Segundos */}
              <div className="flex flex-col items-center min-w-max">
                <span className="leading-tight">{formatNumber(timeLeft.seconds)}</span>
                <span className="font-normal mt-0.5" style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}>s</span>
              </div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="space-y-2">
            <div className="w-full bg-[#0A1E47]/20 rounded-full h-3 md:h-4 overflow-hidden">
              <div
                className={`${getProgressColor()} h-full transition-all duration-1000`}
                style={{ width: `${timeLeft.percentage}%` }}
              />
            </div>
            <p className="text-xs md:text-sm text-white/80 text-center font-semibold">
              {timeLeft.percentage}% da fase restante
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
