'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'
import { DEBUG } from '@/lib/debug'

// Helper para mapear número da fase para nome e duração
function getPhaseInfo(phase: number): { name: string; duration_minutes: number } {
  const phases = [
    { name: 'Preparação', duration_minutes: 0 },
    { name: 'Fase 1: Descoberta', duration_minutes: 150 }, // 2h30min
    { name: 'Fase 2: Criação', duration_minutes: 210 },    // 3h30min
    { name: 'Fase 3: Estratégia', duration_minutes: 150 }, // 2h30min (CORRIGIDO: era 90)
    { name: 'Fase 4: Refinamento', duration_minutes: 120 }, // 2h
    { name: 'Fase 5: Pitch Final', duration_minutes: 90 }  // 1h30min (CORRIGIDO: era 150)
  ]
  return phases[phase] || { name: 'Fase Desconhecida', duration_minutes: 0 }
}

// ✨ P5: MIGRATION TO REALTIME
// Hook para ranking com Realtime Subscription + Polling Fallback
// Benefits:
// - Instantaneous ranking updates (<100ms)
// - 90% reduction in requests (30 req/min → ~3 req/min)
// - No enrichment needed (live_ranking is computed view)
export function useRealtimeRanking() {
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const subscriptionRef = useRef<any>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionHealthRef = useRef<boolean>(false)
  const isPageVisibleRef = useRef(true)
  const supabase = supabaseRef.current
  const POLLING_DEBOUNCE_MS = 5000 // Wait 5s of Realtime inactivity before activating polling

  // 🔄 POLLING FALLBACK: When Realtime is unavailable
  const fetchRankingFallback = async () => {
    if (!isPageVisibleRef.current) return

    try {
      DEBUG.log('useRealtimeRanking-Fallback', '⏳ Polling fallback...')
      const { data, error } = await supabase
        .from('live_ranking')
        .select('*')
        .order('total_points', { ascending: false })

      if (!error && data) {
        setRanking(data)
      }
    } catch (err) {
      DEBUG.error('useRealtimeRanking-Fallback', 'Error:', err)
    }
  }

  useEffect(() => {
    // Detectar cuando la aba está visível ou oculta
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    let mounted = true

    // 📡 REALTIME SUBSCRIPTION
    const setupRealtimeRanking = async () => {
      try {
        DEBUG.log('useRealtimeRanking', '📡 Initial load...')
        const { data: initialData, error: initialError } = await supabase
          .from('live_ranking')
          .select('*')
          .order('total_points', { ascending: false })

        if (initialError) {
          DEBUG.error('useRealtimeRanking', 'Initial load error:', initialError)
          setLoading(false)
          // Fallback to polling if initial load fails
          if (mounted && !pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(fetchRankingFallback, 10000)
          }
          return
        }

        if (mounted) {
          setRanking(initialData || [])
          setLoading(false)
        }

        // Subscribe to ranking changes
        if (!mounted) return

        DEBUG.log('useRealtimeRanking', '🔔 Configurando Realtime subscription...')
        const channel = supabase
          .channel('public:live_ranking')
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'live_ranking'
            },
            async (payload: any) => {
              DEBUG.log('useRealtimeRanking', `📡 Mudança detectada:`, payload.eventType)

              if (!mounted || !isPageVisibleRef.current) return

              try {
                const { data: allRanking, error } = await supabase
                  .from('live_ranking')
                  .select('*')
                  .order('total_points', { ascending: false })

                if (!error && allRanking && mounted) {
                  setRanking(allRanking)
                }
              } catch (err) {
                DEBUG.error('useRealtimeRanking', 'Error fetching updated ranking:', err)
              }
            }
          )
          .subscribe((status: any) => {
            DEBUG.log('useRealtimeRanking', `🔔 Subscription status: ${status}`)

            subscriptionHealthRef.current = status === 'SUBSCRIBED'

            if (status === 'SUBSCRIBED') {
              DEBUG.log('useRealtimeRanking', '✅ Realtime subscription ativa!')

              // WebSocket working: stop polling
              if (pollingDebounceRef.current) {
                clearTimeout(pollingDebounceRef.current)
                pollingDebounceRef.current = null
              }
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
            } else {
              DEBUG.warn('useRealtimeRanking', `⚠️ Realtime inativo, ativando fallback...`)

              // WebSocket not working: activate polling fallback
              if (!pollingDebounceRef.current && mounted) {
                pollingDebounceRef.current = setTimeout(() => {
                  if (subscriptionHealthRef.current === false && !pollingIntervalRef.current) {
                    DEBUG.log('useRealtimeRanking', '🔄 Ativando polling fallback...')
                    // Poll every 10 seconds (less aggressive than before)
                    pollingIntervalRef.current = setInterval(fetchRankingFallback, 10000)
                  }
                  pollingDebounceRef.current = null
                }, POLLING_DEBOUNCE_MS)
              }
            }
          })

        subscriptionRef.current = channel
      } catch (err) {
        DEBUG.error('useRealtimeRanking', 'Realtime setup error:', err)
        // If Realtime fails, activate polling
        if (mounted && !pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(fetchRankingFallback, 10000)
        }
      }
    }

    setupRealtimeRanking()

    // 🧹 CLEANUP
    return () => {
      mounted = false
      if (subscriptionRef.current) {
        DEBUG.log('useRealtimeRanking', '🧹 Limpando subscription...')
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      if (pollingDebounceRef.current) {
        clearTimeout(pollingDebounceRef.current)
        pollingDebounceRef.current = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [supabase])

  return { ranking, loading }
}

// Hook para fase com WebSocket Realtime
export function useRealtimePhase() {
  const [phase, setPhase] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const isPageVisibleRef = useRef(true)
  const rpcCacheRef = useRef<{ data: any; timestamp: number } | null>(null)
  const RPC_CACHE_DURATION_MS = 5000 // Cache RPC results for 5 seconds

  useEffect(() => {
    // Detectar quando a aba está visível ou oculta
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    let isFetching = false // Evitar chamadas simultâneas

    // Buscar dados com fallback (RPC se existir, caso contrário direct query)
    const fetchPhase = async () => {
      if (isFetching || !isPageVisibleRef.current) return // Skip se já buscando OU página oculta

      isFetching = true
      try {
        let eventConfig = null
        let activeQuest = null

        // ✅ OPTIMIZATION: Verificar cache de RPC primeiro
        const now = Date.now()
        const cachedRPC = rpcCacheRef.current
        if (cachedRPC && now - cachedRPC.timestamp < RPC_CACHE_DURATION_MS) {
          DEBUG.log('useRealtimePhase', `✅ Usando cache RPC (válido por mais ${RPC_CACHE_DURATION_MS - (now - cachedRPC.timestamp)}ms)`)
          eventConfig = cachedRPC.data.event_config
          activeQuest = cachedRPC.data.active_quest
        } else {
          // Tentar RPC primeiro
          try {
            DEBUG.log('useRealtimePhase', `📡 Chamando RPC...`)
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_phase_data')
            if (!rpcError && rpcData?.event_config) {
              DEBUG.log('useRealtimePhase', `✅ RPC success`)
              eventConfig = rpcData.event_config
              activeQuest = rpcData.active_quest
              // ✅ Cachear resultado de RPC
              rpcCacheRef.current = { data: rpcData, timestamp: now }
            } else {
              DEBUG.warn('useRealtimePhase', `⚠️ RPC failed, using fallback queries`)
            }
          } catch (rpcErr) {
            DEBUG.warn('useRealtimePhase', `⚠️ RPC error: ${rpcErr}`)
            // Continue to fallback
          }
        }

        // Fallback: Buscar event_config diretamente se RPC falhou
        if (!eventConfig) {
          DEBUG.log('useRealtimePhase', `🔄 Usando fallback queries (sem RPC)`)
          const { data: configData, error: configError } = await supabase
            .from('event_config')
            .select('*')
            .single()

          if (configError || !configData) {
            DEBUG.error('useRealtimePhase', 'Config fetch error:', configError)
            setPhase(null)
            setLoading(false)
            isFetching = false
            return
          }

          eventConfig = configData

          // Buscar quest ativa se houver
          if (eventConfig.current_phase > 0) {
            const { data: questData } = await supabase
              .from('quests')
              .select('*')
              .eq('phase_id', eventConfig.current_phase)
              .order('order_index', { ascending: true })
              .limit(1)

            if (questData?.length) {
              activeQuest = questData[0]
            }
          }
        }

        const phaseInfo = getPhaseInfo(eventConfig.current_phase)

        // Obter timestamp de quando a fase atual começou
        let phaseStartTime = null
        if (eventConfig.current_phase > 0 && eventConfig.event_started) {
          const phaseStartColumn = `phase_${eventConfig.current_phase}_start_time`
          phaseStartTime = eventConfig[phaseStartColumn]
        }

        const phaseData = {
          ...eventConfig,
          event_status: eventConfig.event_started
            ? (eventConfig.event_ended ? 'ended' : 'running')
            : 'not_started',
          phase_started_at: phaseStartTime,
          phases: phaseInfo,
          active_quest: activeQuest
        }

        setPhase(phaseData)
        setLoading(false)
      } catch (err) {
        DEBUG.error('useRealtimePhase', 'Error:', err)
        setPhase(null)
        setLoading(false)
      } finally {
        isFetching = false
      }
    }

    // Buscar imediatamente
    fetchPhase()

    // 🔄 Polling a cada 5 segundos (RPC cacheia por 5s anyway)
    // IMPORTANTE: 500ms era muito agressivo
    // 5s = 12 req/min (matches RPC cache duration)
    let pollInterval: NodeJS.Timeout
    const timeoutId = setTimeout(() => {
      pollInterval = setInterval(fetchPhase, 5000)
    }, 0)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      if (pollInterval) {
        clearInterval(pollInterval)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [supabase])

  return { phase, loading }
}

// ✨ P5: MIGRATION TO REALTIME
// Hook para penalidades com Realtime Subscription + Polling Fallback
// Benefits:
// - Instantaneous updates (<100ms vs 3s polling)
// - 90% reduction in requests (20 req/min → ~2 req/min)
// - Same pattern as useRealtimeQuests
export function useRealtimePenalties() {
  const [penalties, setPenalties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { play } = useSoundSystem()
  const playRef = useRef(play) // ✅ FIX: Store play in ref to avoid dependency array recreation
  const supabaseRef = useRef(createClient())
  const subscriptionRef = useRef<any>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionHealthRef = useRef<boolean>(false)
  const previousPenaltyIdsRef = useRef<Set<string>>(new Set())
  const isFirstRenderRef = useRef(true)
  const isPageVisibleRef = useRef(true)
  const supabase = supabaseRef.current
  const POLLING_DEBOUNCE_MS = 5000 // Wait 5s of Realtime inactivity before activating polling

  // ✅ FIX: Update playRef when play function changes
  useEffect(() => {
    playRef.current = play
  }, [play])

  console.log(`🎯 [useRealtimePenalties] Hook mounted/updated. Current state:`, {
    isFirstRender: isFirstRenderRef.current,
    previousPenaltyCount: previousPenaltyIdsRef.current.size,
    isPageVisible: isPageVisibleRef.current,
    playAvailable: typeof play === 'function'
  })

  // Helper: Enrich penalties with teams and evaluators
  const enrichPenalties = async (penaltiesData: any[]) => {
    if (!penaltiesData || penaltiesData.length === 0) {
      console.log(`⚠️ [enrichPenalties] Dados vazios`)
      return []
    }

    console.log(`🔧 [enrichPenalties] Enriquecendo ${penaltiesData.length} penalidades...`)
    try {
      // Extract unique IDs
      const teamIds = [...new Set(penaltiesData.map((p: any) => p.team_id))]
      const evaluatorIds = [
        ...new Set(
          penaltiesData
            .filter((p: any) => p.assigned_by_evaluator_id)
            .map((p: any) => p.assigned_by_evaluator_id)
        )
      ]

      // Fetch teams and evaluators in parallel
      const [teamsResult, evaluatorsResult] = await Promise.all([
        teamIds.length > 0
          ? supabase.from('teams').select('id, name, email').in('id', teamIds)
          : Promise.resolve({ data: [], error: null }),
        evaluatorIds.length > 0
          ? supabase.from('evaluators').select('id, name').in('id', evaluatorIds)
          : Promise.resolve({ data: [], error: null })
      ])

      // Build maps
      const testEmails = ['admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com']
      const teamMap = new Map(
        (teamsResult.data || [])
          .filter((t: any) => !testEmails.includes(t.email))
          .map((t: any) => [t.id, t.name])
      )
      const evaluatorMap = new Map(
        (evaluatorsResult.data || []).map((e: any) => [e.id, e.name])
      )

      // Format with enrichment
      const enriched = penaltiesData.map((p: any) => ({
        id: p.id,
        team_id: p.team_id,
        team_name: teamMap.get(p.team_id) || 'Equipe Desconhecida',
        penalty_type: p.penalty_type,
        points_deduction: p.points_deduction !== null && p.points_deduction !== undefined ? p.points_deduction : 0,
        reason: p.reason || null,
        assigned_by_admin: p.assigned_by_admin || false,
        evaluator_name: p.assigned_by_evaluator_id ? evaluatorMap.get(p.assigned_by_evaluator_id) : null,
        created_at: p.created_at
      }))

      console.log(`✅ [enrichPenalties] ${enriched.length} penalidades enriquecidas com sucesso`)
      return enriched
    } catch (err) {
      DEBUG.error('useRealtimePenalties-enrichPenalties', 'Error:', err)
      return penaltiesData
    }
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    let mounted = true

    // 🔄 POLLING FALLBACK: When Realtime is unavailable
    const fetchPenaltiesFallback = async () => {
      if (!mounted) return

      try {
        DEBUG.log('useRealtimePenalties-Fallback', '⏳ Polling fallback...')
        const { data: penaltiesData, error } = await supabase
          .from('penalties')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && penaltiesData && mounted) {
          const enriched = await enrichPenalties(penaltiesData)
          setPenalties(enriched)
        }
      } catch (err) {
        DEBUG.error('useRealtimePenalties-Fallback', 'Error:', err)
      }
    }

    // 📡 REALTIME SUBSCRIPTION
    const setupRealtimePenalties = async () => {
      try {
        DEBUG.log('useRealtimePenalties', '📡 Initial load...')
        const { data: initialData, error: initialError } = await supabase
          .from('penalties')
          .select('*')
          .order('created_at', { ascending: false })

        if (initialError) {
          DEBUG.error('useRealtimePenalties', 'Initial load error:', initialError)
          setLoading(false)
          // Fallback to polling if initial load fails
          if (mounted && !pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(fetchPenaltiesFallback, 10000)
          }
          return
        }

        if (mounted) {
          const enriched = await enrichPenalties(initialData || [])
          setPenalties(enriched)
          previousPenaltyIdsRef.current = new Set(enriched.map((p: any) => p.id))
          // ✅ FIX: Marcar primeira renderização como completa AGORA
          // Isso permite que novos eventos de Realtime toquem som
          isFirstRenderRef.current = false
          setLoading(false)
          console.log(`✅ [useRealtimePenalties] Primeira renderização completa! Próximas penalidades tocarão som.`)
        }

        // Subscribe to penalties changes
        if (!mounted) return

        DEBUG.log('useRealtimePenalties', '🔔 Configurando Realtime subscription...')
        const channel = supabase
          .channel('public:penalties')
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'penalties'
            },
            async (payload: any) => {
              console.log(`🔴 [useRealtimePenalties] REALTIME CALLBACK DISPARADO!`, {
                eventType: payload.eventType,
                newData: payload.new,
                oldData: payload.old,
                mounted
              })
              DEBUG.log('useRealtimePenalties', `📡 Mudança detectada:`, payload.eventType)

              if (!mounted) return

              try {
                const { data: allPenalties, error } = await supabase
                  .from('penalties')
                  .select('*')
                  .order('created_at', { ascending: false })

                if (!error && allPenalties && mounted) {
                  console.log(`📊 [useRealtimePenalties] Penalidades carregadas do banco:`, {
                    total: allPenalties.length,
                    ids: allPenalties.map(p => p.id)
                  })
                  const enriched = await enrichPenalties(allPenalties)

                  // Detect new penalties and play sound
                  console.log(`🔍 [useRealtimePenalties] Estado antes de detectar penalidades:`, {
                    isFirstRender: isFirstRenderRef.current,
                    pageVisible: isPageVisibleRef.current,
                    playFunctionAvailable: typeof play === 'function'
                  })
                  if (!isFirstRenderRef.current) {
                    enriched.forEach((penalty: any) => {
                      if (!previousPenaltyIdsRef.current.has(penalty.id)) {
                        DEBUG.log('useRealtimePenalties', `🔊 PENALTY NOVA: ${penalty.team_name}`)
                        console.log(`🎵 [useRealtimePenalties] NOVA PENALIDADE DETECTADA! ID: ${penalty.id}, Team: ${penalty.team_name}`)

                        // ✅ FIX: SEMPRE atualizar estado anterior, mesmo se página está oculta
                        previousPenaltyIdsRef.current.add(penalty.id)

                        // Só tocar som se página está visível
                        if (isPageVisibleRef.current) {
                          console.log(`📍 [useRealtimePenalties] Página VISÍVEL - tentando tocar som 'penalty'`)
                          // ✅ FIX: Usar playRef.current em vez de play para evitar closure stale
                          if (typeof playRef.current === 'function') {
                            console.log(`✅ [useRealtimePenalties] play() é função, chamando play('penalty')`)
                            playRef.current('penalty')
                          } else {
                            console.warn(`❌ [useRealtimePenalties] play() NÃO é uma função! Type: ${typeof playRef.current}`)
                          }
                        } else {
                          // Página está oculta, som não será tocado agora
                          console.log(`📵 [useRealtimePenalties] Página OCULTA - som não tocado para ${penalty.team_name}`)
                        }
                      } else {
                        console.log(`ℹ️ [useRealtimePenalties] Penalidade ID ${penalty.id} já conhecida - não tocará som`)
                      }
                    })
                  } else {
                    console.log(`⏳ [useRealtimePenalties] Primeira renderização - ${enriched.length} penalidades carregadas, som não tocará`)
                  }

                  previousPenaltyIdsRef.current = new Set(enriched.map((p: any) => p.id))
                  setPenalties(enriched)
                }
              } catch (err) {
                DEBUG.error('useRealtimePenalties', 'Error enriching penalty:', err)
              }
            }
          )
          .subscribe((status: any) => {
            console.log(`📡 [useRealtimePenalties.subscribe] Status: ${status}`)
            DEBUG.log('useRealtimePenalties', `🔔 Subscription status: ${status}`)

            subscriptionHealthRef.current = status === 'SUBSCRIBED'

            if (status === 'SUBSCRIBED') {
              console.log(`✅ [useRealtimePenalties] REALTIME SUBSCRIPTION ATIVA! Agora está ouvindo mudanças na tabela 'penalties'`)
              DEBUG.log('useRealtimePenalties', '✅ Realtime subscription ativa!')

              // WebSocket working: stop polling
              if (pollingDebounceRef.current) {
                clearTimeout(pollingDebounceRef.current)
                pollingDebounceRef.current = null
              }
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
            } else {
              console.warn(`⚠️ [useRealtimePenalties] Realtime NÃO está ativo! Status: ${status}`)
              DEBUG.warn('useRealtimePenalties', `⚠️ Realtime inativo, ativando fallback...`)

              // WebSocket not working: activate polling fallback
              if (!pollingDebounceRef.current && mounted) {
                pollingDebounceRef.current = setTimeout(() => {
                  if (subscriptionHealthRef.current === false && !pollingIntervalRef.current) {
                    DEBUG.log('useRealtimePenalties', '🔄 Ativando polling fallback...')
                    console.log(`🔄 [useRealtimePenalties] ATIVANDO POLLING FALLBACK (Realtime indisponível)`)
                    // Poll every 10 seconds (less aggressive than before)
                    pollingIntervalRef.current = setInterval(fetchPenaltiesFallback, 10000)
                  }
                  pollingDebounceRef.current = null
                }, POLLING_DEBOUNCE_MS)
              }
            }
          })

        subscriptionRef.current = channel
      } catch (err) {
        DEBUG.error('useRealtimePenalties', 'Realtime setup error:', err)
        // If Realtime fails, activate polling
        if (mounted && !pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(fetchPenaltiesFallback, 10000)
        }
      }
    }

    setupRealtimePenalties()

    // 🧹 CLEANUP
    return () => {
      mounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (subscriptionRef.current) {
        DEBUG.log('useRealtimePenalties', '🧹 Limpando subscription...')
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      if (pollingDebounceRef.current) {
        clearTimeout(pollingDebounceRef.current)
        pollingDebounceRef.current = null
      }
    }
  }, [supabase]) // ✅ FIX: Removed 'play' from dependency - now using playRef instead

  return { penalties, loading }
}

// ✨ P5: MIGRATION TO REALTIME
// Hook para status dos avaliadores com Realtime Subscription + Polling Fallback
// Benefits:
// - Instant online/offline status (<100ms)
// - 90% reduction in requests (12 req/min → ~1-2 req/min)
// - Immediate sound alerts for status changes
export function useRealtimeEvaluators() {
  const [evaluators, setEvaluators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { play } = useSoundSystem()
  const playRef = useRef(play) // ✅ FIX: Store play in ref to avoid dependency array recreation
  const supabaseRef = useRef(createClient())
  const subscriptionRef = useRef<any>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionHealthRef = useRef<boolean>(false)
  const previousStateRef = useRef<Record<string, boolean>>({})
  const isPageVisibleRef = useRef(true)
  const supabase = supabaseRef.current
  const POLLING_DEBOUNCE_MS = 5000 // Wait 5s of Realtime inactivity before activating polling

  // ✅ FIX: Update playRef when play function changes
  useEffect(() => {
    playRef.current = play
  }, [play])

  // 🔄 POLLING FALLBACK: When Realtime is unavailable
  const fetchEvaluatorsFallback = async () => {
    if (!isPageVisibleRef.current) return

    try {
      DEBUG.log('useRealtimeEvaluators-Fallback', '⏳ Polling fallback...')
      const { data, error } = await supabase
        .from('evaluators')
        .select('id, name, email, specialty, is_online')
        .order('is_online', { ascending: false })
        .order('name', { ascending: true })

      if (!error && data) {
        setEvaluators(data)
      }
    } catch (err) {
      DEBUG.error('useRealtimeEvaluators-Fallback', 'Error:', err)
    }
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    let mounted = true

    // 📡 REALTIME SUBSCRIPTION
    const setupRealtimeEvaluators = async () => {
      try {
        DEBUG.log('useRealtimeEvaluators', '📡 Initial load...')
        const { data: initialData, error: initialError } = await supabase
          .from('evaluators')
          .select('id, name, email, specialty, is_online')
          .order('is_online', { ascending: false })
          .order('name', { ascending: true })

        if (initialError) {
          DEBUG.error('useRealtimeEvaluators', 'Initial load error:', initialError)
          setLoading(false)
          // Fallback to polling if initial load fails
          if (mounted && !pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(fetchEvaluatorsFallback, 10000)
          }
          return
        }

        if (mounted) {
          // Store initial online state
          initialData?.forEach((evaluator: any) => {
            previousStateRef.current[evaluator.id] = evaluator.is_online
          })
          setEvaluators(initialData || [])
          setLoading(false)
        }

        // Subscribe to evaluators changes
        if (!mounted) return

        DEBUG.log('useRealtimeEvaluators', '🔔 Configurando Realtime subscription...')
        const channel = supabase
          .channel('public:evaluators')
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'evaluators'
            },
            async (payload: any) => {
              DEBUG.log('useRealtimeEvaluators', `📡 Mudança detectada:`, payload.eventType)

              if (!mounted) return

              try {
                const { data: allEvaluators, error } = await supabase
                  .from('evaluators')
                  .select('id, name, email, specialty, is_online')
                  .order('is_online', { ascending: false })
                  .order('name', { ascending: true })

                if (!error && allEvaluators && mounted) {
                  // Detect online/offline status changes and play sounds
                  allEvaluators.forEach((evaluator: any) => {
                    const previousOnlineState = previousStateRef.current[evaluator.id]

                    // Log state transitions to help debug missing sounds
                    if (previousOnlineState !== undefined && previousOnlineState !== evaluator.is_online) {
                      console.log(`🔔 [useRealtimeEvaluators] State change for ${evaluator.name}: ${previousOnlineState} -> ${evaluator.is_online}`)

                      // ✅ FIX: SEMPRE atualizar estado anterior, mesmo se página está oculta
                      // Isso garante que quando a página ficar visível novamente, não haverá som atrasado
                      previousStateRef.current[evaluator.id] = evaluator.is_online

                      // Só tocar som se página está visível
                      if (isPageVisibleRef.current) {
                        if (evaluator.is_online) {
                          DEBUG.log('useRealtimeEvaluators', `🟢 Avaliador online: ${evaluator.name}`)
                          console.log(`🎵 [useRealtimeEvaluators] Attempting to play sound: evaluator-online for ${evaluator.name}`)
                          // ✅ FIX: Usar playRef.current em vez de play para evitar closure stale
                          if (typeof playRef.current === 'function') {
                            playRef.current('evaluator-online')
                          } else {
                            console.warn(`❌ [useRealtimeEvaluators] play() não é uma função!`, typeof playRef.current)
                          }
                        } else {
                          DEBUG.log('useRealtimeEvaluators', `⚫ Avaliador offline: ${evaluator.name}`)
                          console.log(`🎵 [useRealtimeEvaluators] Attempting to play sound: evaluator-offline for ${evaluator.name}`)
                          // ✅ FIX: Usar playRef.current em vez de play para evitar closure stale
                          if (typeof playRef.current === 'function') {
                            playRef.current('evaluator-offline')
                          } else {
                            console.warn(`❌ [useRealtimeEvaluators] play() não é uma função!`, typeof playRef.current)
                          }
                        }
                      } else {
                        // Página está oculta, som não será tocado agora
                        console.log(`📵 [useRealtimeEvaluators] Página oculta, som não tocado para ${evaluator.name} (${evaluator.is_online ? 'online' : 'offline'})`)
                      }
                    } else if (previousOnlineState === undefined) {
                      // Primeira vez que vemos este avaliador - guardar estado mas não tocar som
                      previousStateRef.current[evaluator.id] = evaluator.is_online
                    }
                  })

                  setEvaluators(allEvaluators)
                }
              } catch (err) {
                DEBUG.error('useRealtimeEvaluators', 'Error fetching updated evaluators:', err)
              }
            }
          )
          .subscribe((status: any) => {
            DEBUG.log('useRealtimeEvaluators', `🔔 Subscription status: ${status}`)

            subscriptionHealthRef.current = status === 'SUBSCRIBED'

            if (status === 'SUBSCRIBED') {
              DEBUG.log('useRealtimeEvaluators', '✅ Realtime subscription ativa!')

              // WebSocket working: stop polling
              if (pollingDebounceRef.current) {
                clearTimeout(pollingDebounceRef.current)
                pollingDebounceRef.current = null
              }
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
            } else {
              DEBUG.warn('useRealtimeEvaluators', `⚠️ Realtime inativo, ativando fallback...`)

              // WebSocket not working: activate polling fallback
              if (!pollingDebounceRef.current && mounted) {
                pollingDebounceRef.current = setTimeout(() => {
                  if (subscriptionHealthRef.current === false && !pollingIntervalRef.current) {
                    DEBUG.log('useRealtimeEvaluators', '🔄 Ativando polling fallback...')
                    // Poll every 10 seconds (less aggressive than before)
                    pollingIntervalRef.current = setInterval(fetchEvaluatorsFallback, 10000)
                  }
                  pollingDebounceRef.current = null
                }, POLLING_DEBOUNCE_MS)
              }
            }
          })

        subscriptionRef.current = channel
      } catch (err) {
        DEBUG.error('useRealtimeEvaluators', 'Realtime setup error:', err)
        // If Realtime fails, activate polling
        if (mounted && !pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(fetchEvaluatorsFallback, 10000)
        }
      }
    }

    setupRealtimeEvaluators()

    // 🧹 CLEANUP
    return () => {
      mounted = false
      if (subscriptionRef.current) {
        DEBUG.log('useRealtimeEvaluators', '🧹 Limpando subscription...')
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      if (pollingDebounceRef.current) {
        clearTimeout(pollingDebounceRef.current)
        pollingDebounceRef.current = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [supabase]) // ✅ FIX: Removed 'play' from dependency - now using playRef instead

  return { evaluators, loading }
}