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

// Hook para ranking com Polling (WebSocket removido para melhor performance no free tier)
export function useRealtimeRanking() {
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const isPageVisibleRef = useRef(true)

  useEffect(() => {
    // Detectar quando a aba está visível ou oculta
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    let isFetching = false

    const fetchRanking = async () => {
      // Não fazer fetch se a página não está visível (economiza dados)
      if (!isPageVisibleRef.current || isFetching) return

      isFetching = true
      try {
        const { data, error } = await supabase
          .from('live_ranking')
          .select('*')
          .order('total_points', { ascending: false })

        if (!error && data) {
          setRanking(data)
        }
      } catch (err) {
        DEBUG.error('useRealtimeRanking', 'Error:', err)
      } finally {
        setLoading(false)
        isFetching = false
      }
    }

    // Buscar imediatamente
    fetchRanking()

    // 🔄 Polling a cada 2 segundos (não 500ms)
    // IMPORTANTE: 500ms era muito agressivo (120 req/min)
    // 2s = 30 req/min (mais razoável para Supabase free tier)
    const pollInterval = setInterval(fetchRanking, 2000)

    // Cleanup
    return () => {
      clearInterval(pollInterval)
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
  const supabaseRef = useRef(createClient())
  const subscriptionRef = useRef<any>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionHealthRef = useRef<boolean>(false)
  const previousPenaltyIdsRef = useRef<Set<string>>(new Set())
  const isFirstRenderRef = useRef(true)
  const supabase = supabaseRef.current
  const POLLING_DEBOUNCE_MS = 5000 // Wait 5s of Realtime inactivity before activating polling

  // Helper: Enrich penalties with teams and evaluators
  const enrichPenalties = async (penaltiesData: any[]) => {
    if (!penaltiesData || penaltiesData.length === 0) return []

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
      return penaltiesData.map((p: any) => ({
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
    } catch (err) {
      DEBUG.error('useRealtimePenalties-enrichPenalties', 'Error:', err)
      return penaltiesData
    }
  }

  useEffect(() => {
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
          setLoading(false)
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
              DEBUG.log('useRealtimePenalties', `📡 Mudança detectada:`, payload.eventType)

              if (!mounted) return

              try {
                const { data: allPenalties, error } = await supabase
                  .from('penalties')
                  .select('*')
                  .order('created_at', { ascending: false })

                if (!error && allPenalties && mounted) {
                  const enriched = await enrichPenalties(allPenalties)

                  // Detect new penalties and play sound
                  if (!isFirstRenderRef.current) {
                    enriched.forEach((penalty: any) => {
                      if (!previousPenaltyIdsRef.current.has(penalty.id)) {
                        DEBUG.log('useRealtimePenalties', `🔊 PENALTY NOVA: ${penalty.team_name}`)
                        play('penalty')
                      }
                    })
                  }

                  previousPenaltyIdsRef.current = new Set(enriched.map((p: any) => p.id))
                  if (isFirstRenderRef.current) {
                    isFirstRenderRef.current = false
                  }

                  setPenalties(enriched)
                }
              } catch (err) {
                DEBUG.error('useRealtimePenalties', 'Error enriching penalty:', err)
              }
            }
          )
          .subscribe((status: any) => {
            DEBUG.log('useRealtimePenalties', `🔔 Subscription status: ${status}`)

            subscriptionHealthRef.current = status === 'SUBSCRIBED'

            if (status === 'SUBSCRIBED') {
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
              DEBUG.warn('useRealtimePenalties', `⚠️ Realtime inativo, ativando fallback...`)

              // WebSocket not working: activate polling fallback
              if (!pollingDebounceRef.current && mounted) {
                pollingDebounceRef.current = setTimeout(() => {
                  if (subscriptionHealthRef.current === false && !pollingIntervalRef.current) {
                    DEBUG.log('useRealtimePenalties', '🔄 Ativando polling fallback...')
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
  }, [supabase, play])

  return { penalties, loading }
}

// Hook para status dos avaliadores com Polling (WebSocket removido)
export function useRealtimeEvaluators() {
  const [evaluators, setEvaluators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { play } = useSoundSystem()
  const previousStateRef = useRef<Record<string, boolean>>({})
  const isPageVisibleRef = useRef(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    let isFetching = false

    const fetchEvaluators = async () => {
      if (isFetching || !isPageVisibleRef.current) return
      
      isFetching = true
      try {
        const { data, error } = await supabase
          .from('evaluators')
          .select('id, name, email, specialty, is_online')
          .order('is_online', { ascending: false })
          .order('name', { ascending: true })

        if (!error && data) {
          // Detectar mudanças de online/offline
          data.forEach((evaluator: any) => {
            const previousOnlineState = previousStateRef.current[evaluator.id]
            
            if (previousOnlineState !== undefined && previousOnlineState !== evaluator.is_online) {
              if (evaluator.is_online) {
                play('evaluator-online')
              } else {
                play('evaluator-offline')
              }
            }
            
            previousStateRef.current[evaluator.id] = evaluator.is_online
          })

          setEvaluators(data)
        }
      } catch (err) {
        DEBUG.error('useRealtimeEvaluators', 'Error:', err)
      } finally {
        setLoading(false)
        isFetching = false
      }
    }

    // Buscar imediatamente
    fetchEvaluators()

    // 🔄 Polling a cada 5 segundos
    // IMPORTANTE: 500ms era muito agressivo
    // 5s = 12 req/min (status de avaliadores não muda tão rápido)
    let pollInterval: NodeJS.Timeout
    const timeoutId = setTimeout(() => {
      pollInterval = setInterval(fetchEvaluators, 5000)
    }, 0)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      if (pollInterval) {
        clearInterval(pollInterval)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [supabase, play])

  return { evaluators, loading }
}