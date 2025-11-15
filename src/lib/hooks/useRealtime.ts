'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSoundSystem } from '@/lib/hooks/useSoundSystem'

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
        console.error('[useRealtimeRanking] Error:', err)
      } finally {
        setLoading(false)
        isFetching = false
      }
    }

    // Buscar imediatamente
    fetchRanking()

    // 🔄 Polling staggered a cada 500ms com delay de 0ms (primeiro hook)
    // IMPORTANTE: Cada hook começa em tempo diferente para evitar polling storms
    // T=0ms: useRealtimeRanking
    const pollInterval = setInterval(fetchRanking, 500)

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
          console.log(`✅ [useRealtimePhase] Usando cache RPC (válido por mais ${RPC_CACHE_DURATION_MS - (now - cachedRPC.timestamp)}ms)`)
          eventConfig = cachedRPC.data.event_config
          activeQuest = cachedRPC.data.active_quest
        } else {
          // Tentar RPC primeiro
          try {
            console.log(`📡 [useRealtimePhase] Chamando RPC...`)
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_phase_data')
            if (!rpcError && rpcData?.event_config) {
              console.log(`✅ [useRealtimePhase] RPC success`)
              eventConfig = rpcData.event_config
              activeQuest = rpcData.active_quest
              // ✅ Cachear resultado de RPC
              rpcCacheRef.current = { data: rpcData, timestamp: now }
            } else {
              console.warn(`⚠️ [useRealtimePhase] RPC failed, using fallback queries`)
            }
          } catch (rpcErr) {
            console.warn(`⚠️ [useRealtimePhase] RPC error: ${rpcErr}`)
            // Continue to fallback
          }
        }

        // Fallback: Buscar event_config diretamente se RPC falhou
        if (!eventConfig) {
          console.log(`🔄 [useRealtimePhase] Usando fallback queries (sem RPC)`)
          const { data: configData, error: configError } = await supabase
            .from('event_config')
            .select('*')
            .single()

          if (configError || !configData) {
            console.error('[useRealtimePhase] Config fetch error:', configError)
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
        console.error('[useRealtimePhase] Error:', err)
        setPhase(null)
        setLoading(false)
      } finally {
        isFetching = false
      }
    }

    // Buscar imediatamente
    fetchPhase()

    // 🔄 Polling staggered a cada 500ms com delay de 125ms (segundo hook)
    // IMPORTANTE: Cada hook começa em tempo diferente para evitar polling storms
    // T=125ms: useRealtimePhase
    let pollInterval: NodeJS.Timeout
    const timeoutId = setTimeout(() => {
      pollInterval = setInterval(fetchPhase, 500)
    }, 125)

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

// Hook para penalidades com Polling rápido (som de penalidade)
export function useRealtimePenalties() {
  const [penalties, setPenalties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { play } = useSoundSystem()
  const previousPenaltyIdsRef = useRef<Set<string>>(new Set())
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    let isFetching = false

    const fetchPenalties = async () => {
      if (isFetching) return

      isFetching = true
      try {
        const { data, error } = await supabase
          .from('penalties')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data) {
          // Detectar penalidades novas e tocar som
          if (!isFirstRenderRef.current) {
            data.forEach((penalty: any) => {
              if (!previousPenaltyIdsRef.current.has(penalty.id)) {
                play('penalty')
              }
            })
          }

          // Atualizar conjunto de IDs
          previousPenaltyIdsRef.current = new Set(data.map((p: any) => p.id))

          // Marcar que primeira renderização foi feita
          if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false
          }

          setPenalties(data)
        }
      } catch (err) {
        console.error('[useRealtimePenalties] Error:', err)
      } finally {
        setLoading(false)
        isFetching = false
      }
    }

    // Buscar imediatamente
    fetchPenalties()

    // 🔄 Polling staggered a cada 500ms com delay de 250ms (terceiro hook)
    // T=250ms: useRealtimePenalties
    let pollInterval: NodeJS.Timeout
    const timeoutId = setTimeout(() => {
      pollInterval = setInterval(fetchPenalties, 500)
    }, 250)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      if (pollInterval) {
        clearInterval(pollInterval)
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
        console.error('[useRealtimeEvaluators] Error:', err)
      } finally {
        setLoading(false)
        isFetching = false
      }
    }

    // Buscar imediatamente
    fetchEvaluators()

    // 🔄 Polling staggered a cada 500ms com delay de 375ms (quarto hook)
    // T=375ms: useRealtimeEvaluators
    let pollInterval: NodeJS.Timeout
    const timeoutId = setTimeout(() => {
      pollInterval = setInterval(fetchEvaluators, 500)
    }, 375)

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