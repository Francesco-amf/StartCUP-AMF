'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'
import { useRealtimeQuests } from '@/lib/hooks/useRealtimeQuests'
import { playedSoundsTracker } from '@/lib/audio/playedSoundsTracker'

interface Quest {
  id: string
  order_index: number
  name: string
  description: string
  max_points: number
  deliverable_type: string
  status: string
  duration_minutes: number
  started_at: string | null
  planned_deadline_minutes: number | null
  late_submission_window_minutes: number | null
}

interface CurrentQuestTimerProps {
  phase: number
  phaseStartedAt: string
  phaseDurationMinutes: number
}

// Fallback quest data para fases sem quests no banco
const PHASES_QUESTS_FALLBACK_RAW: Record<number, Partial<Quest>[]> = {
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
    },
    {
      id: 'f-1-4',
      order_index: 4,
      name: '🏆 BOSS FASE 1',
      description: 'Pitch 2min: "Para quem você está resolvendo e por quê?"',
      max_points: 100,
      deliverable_type: 'presentation',
      status: 'scheduled',
      duration_minutes: 10
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
    },
    {
      id: 'f-2-4',
      order_index: 4,
      name: '🏆 BOSS FASE 2',
      description: 'Demo 2min: Protótipo em funcionamento',
      max_points: 100,
      deliverable_type: 'presentation',
      status: 'scheduled',
      duration_minutes: 10
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
    },
    {
      id: 'f-3-4',
      order_index: 4,
      name: '🏆 BOSS FASE 3',
      description: 'Defender modelo de negócio em 3min',
      max_points: 100,
      deliverable_type: 'presentation',
      status: 'scheduled',
      duration_minutes: 10
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
    },
    {
      id: 'f-4-4',
      order_index: 4,
      name: '🏆 BOSS FASE 4',
      description: 'Simulação de pitch com jurado surpresa',
      max_points: 100,
      deliverable_type: 'presentation',
      status: 'scheduled',
      duration_minutes: 10
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
      duration_minutes: 20,
      planned_deadline_minutes: 20,
      late_submission_window_minutes: 15
    },
    {
      id: 'f-5-2',
      order_index: 2,
      name: 'Slides de Impacto',
      description: 'Criar apresentação visual',
      max_points: 50,
      deliverable_type: 'url',
      status: 'scheduled',
      duration_minutes: 40,
      planned_deadline_minutes: 40,
      late_submission_window_minutes: 15
    },
    {
      id: 'f-5-3',
      order_index: 3,
      name: 'Ensaio Geral',
      description: 'Treinar pitch e ajustar timing',
      max_points: 25,
      deliverable_type: 'file',
      status: 'scheduled',
      duration_minutes: 30,
      planned_deadline_minutes: 30,
      late_submission_window_minutes: 15
    }
  ]
}

// Helper para normalizar fallback quests com campos obrigatórios
const normalizeFallbackQuest = (q: Partial<Quest>): Quest => ({
  id: q.id || '',
  order_index: q.order_index || 0,
  name: q.name || '',
  description: q.description || '',
  max_points: q.max_points || 0,
  deliverable_type: q.deliverable_type || 'file',
  status: q.status || 'scheduled',
  duration_minutes: q.duration_minutes || 60,
  started_at: null,
  planned_deadline_minutes: null,
  late_submission_window_minutes: null
})

const PHASES_QUESTS_FALLBACK: Record<number, Quest[]> = Object.entries(PHASES_QUESTS_FALLBACK_RAW).reduce(
  (acc, [phase, quests]) => ({
    ...acc,
    [phase]: quests.map(normalizeFallbackQuest)
  }),
  {}
)

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



  // 🔄 Estado para tempo da QUEST (atualizado a cada segundo)
  const [questTimeRemaining, setQuestTimeRemaining] = useState<number>(0)

  const [quests, setQuests] = useState<Quest[]>([])
  const [loadingQuests, setLoadingQuests] = useState(true)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const { play, soundConfig } = useSoundSystem()
  const previousQuestIdRef = useRef<string | null>(null)
  const currentPhaseRef = useRef<number>(phase) // Track current phase
  const [isPageVisible, setIsPageVisible] = useState(true)
  const lastQuestUpdateRef = useRef<number>(0) // Track last update time for cache busting

  // Atualizar ref quando phase muda
  useEffect(() => {
    currentPhaseRef.current = phase
  }, [phase])

  // 📡 Detectar quando página está visível (para polling adaptativo)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden)
      console.log(`👁️ Page visibility changed: ${!document.hidden ? 'VISIBLE' : 'HIDDEN'}`)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // 🔔 Listen for quest updates from PhaseController (via advance-quest endpoint)
  // When PhaseController calls advance-quest successfully, we force refresh quests immediately
  // We need fetchQuests in dependencies, but it's defined in the next useEffect
  // So we'll create a ref to track it
  const fetchQuestsRef = useRef<(() => Promise<void>) | null>(null)
  const pathname = usePathname()
  const isLiveDashboard = pathname === '/live-dashboard'

  useEffect(() => {
    // ✅ FIX: Only listen for BroadcastChannel messages if we're in live-dashboard
    if (!isLiveDashboard) return

    const channel = new BroadcastChannel('quest-updates')

    const handleMessage = (event: MessageEvent) => {
      console.log(`📢 [BroadcastChannel] Received message:`, event.data)
      if (event.data?.type === 'questAdvanced') {
        console.log(`🔄 [QuestTimer] Forçando atualização imediata de quests após advance...`)
        if (fetchQuestsRef.current) {
          fetchQuestsRef.current()
        }
      }
    }

    channel.addEventListener('message', handleMessage)
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [isLiveDashboard])

  // ✅ REALTIME: Buscar phase_id e usar Realtime Subscriptions para quests
  // Muito mais eficiente que polling (0 requisições quando nada muda)
  const [phaseId, setPhaseId] = useState<string | null>(null)

  useEffect(() => {
    const getPhaseId = async () => {
      try {
        const { data: phaseData, error: phaseError } = await supabase
          .from('phases')
          .select('id')
          .eq('order_index', phase)
          .single()

        if (phaseError || !phaseData) {
          console.error('❌ [CurrentQuestTimer] Erro ao buscar phase_id:', {
            phase,
            error: phaseError?.message
          })
          setPhaseId(null)
          setQuests(PHASES_QUESTS_FALLBACK[phase] || [])
          setLoadingQuests(false)
          return
        }

        console.log(`✅ [CurrentQuestTimer] phase_id encontrado para Fase ${phase}: ${phaseData.id}`)
        setPhaseId(phaseData.id)
      } catch (err) {
        console.error('❌ [CurrentQuestTimer] Erro ao buscar phase_id:', err)
        setPhaseId(null)
        setQuests(PHASES_QUESTS_FALLBACK[phase] || [])
        setLoadingQuests(false)
      }
    }

    getPhaseId()
  }, [phase])

  // 📡 Usar Realtime Subscriptions em vez de polling
  const { quests: realtimeQuests, loading: realtimeLoading, error: realtimeError } = useRealtimeQuests(phaseId)

  useEffect(() => {
    if (phaseId) {
      if (realtimeQuests && realtimeQuests.length > 0) {
        console.log(`✅ [CurrentQuestTimer] Quests atualizadas via Realtime:`, realtimeQuests.map((q: any) => `[${q.order_index}] ${q.name}`))
        setQuests(realtimeQuests)
        setLoadingQuests(false)
      } else if (realtimeError) {
        console.error(`⚠️ [CurrentQuestTimer] Erro ao buscar quests via Realtime:`, realtimeError)
        setQuests(PHASES_QUESTS_FALLBACK[phase] || [])
        setLoadingQuests(false)
      } else if (realtimeLoading) {
        setLoadingQuests(true)
      } else {
        console.log(`⚠️ [CurrentQuestTimer] Nenhuma quest encontrada para Fase ${phase}`)
        setQuests(PHASES_QUESTS_FALLBACK[phase] || [])
        setLoadingQuests(false)
      }

      // Store reference for BroadcastChannel listener
      fetchQuestsRef.current = async () => {
        console.log(`🔄 [CurrentQuestTimer] Refresh solicitado via BroadcastChannel`)
        // Com Realtime, a atualização é automática, mas podemos forçar um re-fetch se necessário
        // Por enquanto, apenas logamos a solicitação
      }
    }
  }, [phaseId, realtimeQuests])

  // 🔊 Detectar mudanças de quest e tocar sons apropriados
  useEffect(() => {
    if (quests.length === 0) return

    // Encontrar quest atual (com started_at mais recente)
    const activeQuests = quests.filter(q => q.started_at !== null && q.started_at !== undefined)
    if (activeQuests.length === 0) return

    const sortedByStart = [...activeQuests].sort((a, b) => {
      const timeA = a.started_at ? new Date(a.started_at).getTime() : 0
      const timeB = b.started_at ? new Date(b.started_at).getTime() : 0
      return timeB - timeA
    })

    const currentQuest = sortedByStart[0]
    const currentQuestId = currentQuest?.id

    // Se a quest mudou OU é a primeira ativação (previousQuestIdRef é null E quest começou há pouco tempo)
    const isQuestChange = previousQuestIdRef.current !== null && previousQuestIdRef.current !== currentQuestId

    // Verificar se é primeira ativação (previousQuestIdRef nulo) E quest começou há menos de 5 segundos
    // Se começou há mais de 5s, é provavelmente um reload da página, não tocar som
    let isFirstActivation = false
    if (previousQuestIdRef.current === null && currentQuestId !== undefined && currentQuest.started_at) {
      // ✅ FIX: Parsear timestamp corretamente (pode ter +00:00 ou Z ou nenhum)
      const cleanStartedAt = currentQuest.started_at.includes('+00:00')
        ? currentQuest.started_at.replace('+00:00', 'Z')
        : currentQuest.started_at.endsWith('Z')
        ? currentQuest.started_at
        : currentQuest.started_at + 'Z'

      const questStartTime = new Date(cleanStartedAt)
      const now = new Date()

      // ✅ SEGURANÇA: Validar se a data é válida antes de usar
      if (isNaN(questStartTime.getTime())) {
        console.warn(`⚠️ [CurrentQuestTimer] Data inválida ao parsear: ${currentQuest.started_at}`)
        return // Não tocar som se data inválida
      }

      const secondsElapsed = (now.getTime() - questStartTime.getTime()) / 1000
      // 🔔 IMPORTANTE: Aumentar limite para 10 segundos para cobrir transições de fase
      isFirstActivation = secondsElapsed < 10

      console.log(`🔍 [CurrentQuestTimer] Primeira quest detectada: ${currentQuest.order_index} (${secondsElapsed.toFixed(2)}s atrás) - isFirstActivation: ${isFirstActivation}`)
      console.log(`🔍 [CurrentQuestTimer] DEBUG: Quest started_at: ${currentQuest.started_at}, Phase: ${currentPhaseRef.current}, Order: ${currentQuest.order_index}`)

      if (!isFirstActivation) {
        console.log(`🔇 [CurrentQuestTimer] Quest ${currentQuest.order_index} começou há ${Math.round(secondsElapsed)}s (reload detectado, som não tocará)`)
      }
    }

    if (isQuestChange || isFirstActivation) {
      if (isQuestChange) {
        console.log(`🔊 [CurrentQuestTimer] Quest mudou! De: ${previousQuestIdRef.current} → Para: ${currentQuestId}`)
      } else {
        console.log(`🔊 [CurrentQuestTimer] Primeira quest ativada! ${currentQuestId}`)
      }

      // Verificar se soundConfig está habilitado antes de tocar som
      if (!soundConfig?.enabled) {
        console.warn(`⚠️ [SoundSystem] Som está desabilitado! soundConfig.enabled = ${soundConfig?.enabled}`)
        // Atualizar referência mesmo sem tocar som
        if (currentQuestId) {
          previousQuestIdRef.current = currentQuestId
        }
        return
      }

      if (soundConfig?.volume === 0) {
        console.warn(`⚠️ [SoundSystem] Volume está em 0! soundConfig.volume = ${soundConfig?.volume}`)
        // Atualizar referência mesmo com volume 0
        if (currentQuestId) {
          previousQuestIdRef.current = currentQuestId
        }
        return
      }

      // Detectar som apropriado para a quest
      const isFirstQuestOfPhase1 = currentPhaseRef.current === 1 && currentQuest.order_index === 1
      const isFirstQuestOfAnyPhase = currentQuest.order_index === 1  // Primera quest de qualquer fase
      const isBoss = currentQuest.order_index === 4 ||
                     currentQuest.deliverable_type === 'presentation' ||
                     (Array.isArray(currentQuest.deliverable_type) && currentQuest.deliverable_type.includes('presentation'))

      console.log(`🔍 [SoundDebug] Detectando som apropriado:`, {
        isFirstQuestOfPhase1,
        isFirstQuestOfAnyPhase,
        isBoss,
        questOrder: currentQuest.order_index,
        questType: currentQuest.deliverable_type,
        soundConfig: { enabled: soundConfig?.enabled, volume: soundConfig?.volume }
      })

      if (isFirstQuestOfPhase1) {
        // Som especial para o começo do evento (Fase 1, Quest 1)
        if (playedSoundsTracker.shouldPlay('phase-1-quest-1')) {
          console.log(`🎬 INÍCIO DO EVENTO! Fase 1, Quest 1 ativada!`)
          console.log('🔊 Tocando som: event-start')
          play('event-start')
        } else {
          console.log(`🔇 [CurrentQuestTimer] event-start já foi tocado`)
        }
      } else if (isBoss) {
        // Som especial para BOSS
        const bossKey = `boss-${currentQuest.id}`

        if (playedSoundsTracker.shouldPlay(bossKey as any)) {
          console.log(`🔥 BOSS DETECTADO! Ordem: ${currentQuest.order_index}, Tipo: ${currentQuest.deliverable_type}`)
          console.log('🔊 Tocando som: boss-spawn (2x para efeito épico!)')
          // Reproduzir boss-spawn 2 vezes com pequeno delay entre elas
          play('boss-spawn')
          setTimeout(() => {
            play('boss-spawn')
          }, 2500) // 2.5 segundos após a primeira, quando a primeira terminar
        }
      } else if (isFirstQuestOfAnyPhase) {
        // ✅ Som especial para primeira quest de CADA FASE (não importa qual)
        // Fase 1 Quest 1 já foi tratada acima (event-start)
        // Fase 2+ Quest 1 deve tocar phase-start
        const phaseKey = `phase-${currentPhaseRef.current}-quest-1` as const

        if (playedSoundsTracker.shouldPlay(phaseKey)) {
          console.log(`🌟 MUDANÇA DE FASE DETECTADA! De Fase ${currentPhaseRef.current - 1 || 0} → Fase ${currentPhaseRef.current}`)
          console.log(`📣 Primeira quest da Fase ${currentPhaseRef.current} iniciada! Tocando som: phase-start`)
          play('phase-start')
        }
      } else {
        // Som padrão para quest normal
        const questKey = `quest-${currentQuest.id}`

        if (playedSoundsTracker.shouldPlay(questKey as any)) {
          console.log(`📣 Quest ${currentQuest.order_index} iniciada! Tocando som: quest-start`)
          play('quest-start')
        }
      }
    } else {
      console.log(`🔇 [CurrentQuestTimer] Sem mudança de quest detectada:`, {
        previousQuestId: previousQuestIdRef.current,
        currentQuestId,
        isQuestChange,
        isFirstActivation
      })
    }

    // Atualizar referência
    if (currentQuestId) {
      previousQuestIdRef.current = currentQuestId
    }
  }, [quests, play, soundConfig])

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

  // 🔄 Usar Date.now() diretamente (Realtime já fornece dados precisos)
  // O problema foi tentar sincronizar com servidor - Realtime já faz isso!
  // Vamos voltar ao cálculo simples mas preciso

  // 🎯 NOVO: Track quando a última quest começou (para pausar o timer da fase)
  const lastQuestStartTimeRef = useRef<number>(0)

  useEffect(() => {
    // Atualizar quando uma quest começa
    const activeQuests = quests.filter(q => q.started_at !== null && q.started_at !== undefined)
    if (activeQuests.length > 0) {
      const sortedByStart = [...activeQuests].sort((a, b) => {
        const timeA = a.started_at ? new Date(a.started_at).getTime() : 0
        const timeB = b.started_at ? new Date(b.started_at).getTime() : 0
        return timeB - timeA
      })
      const currentQuest = sortedByStart[0]
      if (currentQuest.started_at) {
        const cleanTimestamp = currentQuest.started_at.includes('+00:00')
          ? currentQuest.started_at.replace('+00:00', 'Z')
          : currentQuest.started_at.endsWith('Z')
          ? currentQuest.started_at
          : `${currentQuest.started_at}Z`

        lastQuestStartTimeRef.current = new Date(cleanTimestamp).getTime()
      }
    }
  }, [quests])

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

      // 🎯 NOVO: Detectar se há quest ativa
      const activeQuests = quests.filter(q => q.started_at !== null && q.started_at !== undefined)
      const hasActiveQuest = activeQuests.length > 0

      const now = new Date().getTime()

      // 🔥 NOVO: Se não há quest ativa, usar o tempo da última quest como "agora"
      // Isso pausa efetivamente o timer da fase durante os gaps entre quests
      const timeBaseForCalculation = hasActiveQuest ? now : lastQuestStartTimeRef.current

      const elapsed = timeBaseForCalculation - startTime
      const totalDuration = phaseDurationMinutes * 60 * 1000

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

      // 🎯 NOVO: Log quando o timer está pausado
      if (!hasActiveQuest && lastQuestStartTimeRef.current > 0) {
        console.log(`⏸️ [Phase Timer] PAUSADO - Aguardando próxima quest. Tempo restante: ${hours}h ${minutes}m ${seconds}s`)
      }

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
  }, [phaseStartedAt, phaseDurationMinutes, phase, quests])



  // 🔄 useEffect para calcular tempo da quest a cada segundo
  useEffect(() => {
    const calculateQuestTime = () => {
      if (quests.length === 0) {
        setQuestTimeRemaining(0)
        return
      }

      // Encontrar quest atual (com started_at mais recente)
      const activeQuests = quests.filter(q => q.started_at !== null && q.started_at !== undefined)
      if (activeQuests.length === 0) {
        setQuestTimeRemaining(0)
        return
      }

      const sortedByStart = [...activeQuests].sort((a, b) => {
        const timeA = a.started_at ? new Date(a.started_at).getTime() : 0
        const timeB = b.started_at ? new Date(b.started_at).getTime() : 0
        return timeB - timeA
      })

      const currentQuest = sortedByStart[0]
      if (!currentQuest.started_at) {
        setQuestTimeRemaining(0)
        return
      }

      // Limpar timestamp
      let cleanTimestamp = currentQuest.started_at
      if (cleanTimestamp.includes('+00:00')) {
        cleanTimestamp = cleanTimestamp.replace('+00:00', 'Z')
      } else if (!cleanTimestamp.endsWith('Z') && !cleanTimestamp.includes('+')) {
        cleanTimestamp = `${cleanTimestamp}Z`
      }

      const questStartTime = new Date(cleanTimestamp).getTime()

      // 🔧 CORRIGIDO: Usar planned_deadline_minutes com fallback melhorado
      // Prioridade: planned_deadline_minutes > duration_minutes > 60 (fallback padrão)
      const questDuration = currentQuest.planned_deadline_minutes ?? currentQuest.duration_minutes ?? 60
      const questDurationMs = questDuration * 60 * 1000

      const elapsed = Date.now() - questStartTime
      let timeRemaining = Math.max(0, (questDurationMs - elapsed) / 1000)

      setQuestTimeRemaining(timeRemaining)
    }

    calculateQuestTime()
    const interval = setInterval(calculateQuestTime, 1000)
    return () => clearInterval(interval)
  }, [quests])


    const formatNumber = (num: number) => String(num).padStart(2, '0')

  // 🎯 CORRIGIDO: Detectar quest atual baseado em started_at do DB
  // Calcular activeQuests e currentQuestForSync localmente
  const activeQuests = quests.filter(q => q.started_at !== null && q.started_at !== undefined)

  let currentQuestForSync: Quest | undefined
  if (activeQuests.length > 0) {
    const sortedByStart = [...activeQuests].sort((a, b) => {
      const timeA = a.started_at ? new Date(a.started_at).getTime() : 0
      const timeB = b.started_at ? new Date(b.started_at).getTime() : 0
      return timeB - timeA
    })
    currentQuestForSync = sortedByStart[0]
  }

  console.log(`📋 [ActiveQuestFilter] Total quests: ${quests.length}, Active quests: ${activeQuests.length}`)
  console.log(`📋 [ActiveQuestFilter] Todos os quests com seus started_at:`, quests.map(q => ({
    id: q.id,
    order: q.order_index,
    name: q.name,
    started_at: q.started_at,
    status: q.status
  })))

  let currentQuestIndex = 0
  let currentQuest = currentQuestForSync || quests[0]

  if (currentQuestForSync) {
    currentQuestIndex = quests.findIndex(q => q.id === currentQuestForSync.id)

    console.log(`[LiveDashboard] ✅ Quest atual encontrada:`, {
      name: currentQuestForSync.name,
      started_at: currentQuestForSync.started_at,
      planned_deadline_minutes: currentQuestForSync.planned_deadline_minutes,
      duration_minutes: currentQuestForSync.duration_minutes,
      late_submission_window_minutes: currentQuestForSync.late_submission_window_minutes
    })
  } else {
    console.log('[LiveDashboard] ⚠️ Nenhuma quest iniciada. Mostrando primeira quest.')
    console.log('[LiveDashboard] 🔍 Quest details do fallback:', {
      questId: quests[0]?.id,
      questName: quests[0]?.name,
      questStatus: quests[0]?.status,
      questStartedAt: quests[0]?.started_at,
      questOrder: quests[0]?.order_index,
      reason: quests.length === 0 ? 'Nenhuma quest no array' : 'Nenhuma quest com started_at'
    })
  }

  // Garantir que currentQuestIndex nunca ultrapassa quests.length - 1
  currentQuestIndex = Math.min(Math.max(0, currentQuestIndex), Math.max(0, quests.length - 1))

  // 🚨 PROTEÇÃO: Se a quest atual não tem started_at, NÃO mostrar timer
  const questHasStarted = currentQuest && currentQuest.started_at !== null && currentQuest.started_at !== undefined
  if (!questHasStarted) {
    console.warn(`[LiveDashboard] ⚠️ Quest ${currentQuest?.name} não tem started_at! Timer zerado.`)
  }

  // 🎯 NOVO: Detectar se há quest ativa para mostrar status do timer
  const activeQuestsNow = quests.filter(q => q.started_at !== null && q.started_at !== undefined)
  const hasActiveQuest = activeQuestsNow.length > 0

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
                  {questHasStarted 
                    ? `${Math.floor(questTimeRemaining / 60)}:${formatNumber(Math.floor(questTimeRemaining % 60))}`
                    : 'Aguardando início...'
                  }
                </span>
              </div>
              <div className="w-full bg-[#0A1E47]/20 rounded-full h-2 md:h-3 overflow-hidden">
                <div
                  className="bg-[#0A1E47] h-full transition-all duration-1000"
                  style={{
                    width: questHasStarted 
                      ? `${Math.max(0, (questTimeRemaining / (getQuestDurationMs(currentQuestIndex) / 1000)) * 100)}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            {/* AMF Coins info */}
            <div className="flex justify-between items-center pt-2 border-t border-[#00E5FF]/40">
              <span className="text-xs md:text-sm">🪙 AMF Coins desta Quest</span>
              <span className="text-lg md:text-xl font-bold">{currentQuest.max_points} AMF Coins</span>
            </div>
          </div>
        </Card>
      )}

      {/* Total Phase Time */}
      <Card className={`p-4 md:p-6 text-white overflow-visible border-2 transition-all duration-500 ${
        hasActiveQuest
          ? 'bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-[#00E5FF]/40'
          : 'bg-gradient-to-br from-[#0A1E47]/40 to-[#001A4D]/40 border-[#FFD700]/40 animate-pulse'
      }`}>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs md:text-sm font-semibold text-[#00E5FF]">⏱️ TEMPO TOTAL DA FASE</p>
                  {!hasActiveQuest && (
                    <span className="text-xs font-bold text-[#FFD700] bg-[#FFD700]/20 px-2 py-1 rounded-full animate-pulse">
                      ⏸️ PAUSADO
                    </span>
                  )}
                </div>

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
