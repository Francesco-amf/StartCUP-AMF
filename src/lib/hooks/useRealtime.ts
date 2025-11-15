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

// ✨ P2.3 OPTIMIZATION: Consolidada penalties com teams + evaluators em uma única operação
// Hook para penalidades com Polling rápido (som de penalidade) + enrichment
export function useRealtimePenalties() {
  const [penalties, setPenalties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { play } = useSoundSystem()
  const previousPenaltyIdsRef = useRef<Set<string>>(new Set())
  const isFirstRenderRef = useRef(true)
  const penaltiesEnrichCacheRef = useRef<{ data: any; timestamp: number } | null>(null)
  const ENRICH_CACHE_DURATION_MS = 5000 // Cache team/evaluator enrichment for 5s

  useEffect(() => {
    let isFetching = false

    const fetchPenalties = async () => {
      if (isFetching) return

      isFetching = true
      try {
        DEBUG.log('useRealtimePenalties', '📡 Buscando penalidades...')
        const { data: penaltiesData, error: penaltiesError } = await supabase
          .from('penalties')
          .select('*')
          .order('created_at', { ascending: false })

        if (penaltiesError || !penaltiesData || penaltiesData.length === 0) {
          if (penaltiesError) {
            DEBUG.error('useRealtimePenalties', 'Error:', penaltiesError)
          } else {
            DEBUG.log('useRealtimePenalties', 'ℹ️ Nenhuma penalidade encontrada')
          }
          setPenalties([])
          setLoading(false)
          isFetching = false
          return
        }

        DEBUG.log('useRealtimePenalties', `✅ ${penaltiesData.length} penalidades encontradas`)

        // ✨ P2.3: Check cache antes de fazer enrichment queries
        const now = Date.now()
        const cachedEnrich = penaltiesEnrichCacheRef.current
        let teamMap = new Map()
        let evaluatorMap = new Map()

        if (cachedEnrich && now - cachedEnrich.timestamp < ENRICH_CACHE_DURATION_MS) {
          DEBUG.log('useRealtimePenalties', `✅ Usando cache de enrichment (válido por mais ${ENRICH_CACHE_DURATION_MS - (now - cachedEnrich.timestamp)}ms)`)
          teamMap = cachedEnrich.data.teamMap
          evaluatorMap = cachedEnrich.data.evaluatorMap
        } else {
          DEBUG.log('useRealtimePenalties', '🔄 Buscando enrichment data (teams + evaluators)...')

          // Parallel queries para teams e evaluators
          const teamIds = [...new Set(penaltiesData.map((p: any) => p.team_id))]
          const evaluatorIds = [
            ...new Set(
              penaltiesData
                .filter((p: any) => p.assigned_by_evaluator_id)
                .map((p: any) => p.assigned_by_evaluator_id)
            )
          ]

          // Execute ambas as queries em paralelo
          const [teamsResult, evaluatorsResult] = await Promise.all([
            teamIds.length > 0
              ? supabase.from('teams').select('id, name, email').in('id', teamIds)
              : Promise.resolve({ data: [], error: null }),
            evaluatorIds.length > 0
              ? supabase.from('evaluators').select('id, name').in('id', evaluatorIds)
              : Promise.resolve({ data: [], error: null })
          ])

          // Process teams with filtering
          const testEmails = ['admin@test.com', 'avaliador1@test.com', 'avaliador2@test.com', 'avaliador3@test.com']
          if (!teamsResult.error && teamsResult.data) {
            const realTeams = teamsResult.data.filter((t: any) => !testEmails.includes(t.email))
            teamMap = new Map(realTeams.map((t: any) => [t.id, t.name]))
            DEBUG.log('useRealtimePenalties', `✅ Teams enriquecidas: ${teamMap.size}`)
          } else if (teamsResult.error) {
            DEBUG.warn('useRealtimePenalties', '⚠️ Erro ao buscar teams:', teamsResult.error)
          }

          // Process evaluators
          if (!evaluatorsResult.error && evaluatorsResult.data) {
            evaluatorMap = new Map(evaluatorsResult.data.map((e: any) => [e.id, e.name]))
            DEBUG.log('useRealtimePenalties', `✅ Evaluators enriquecidos: ${evaluatorMap.size}`)
          } else if (evaluatorsResult.error) {
            DEBUG.warn('useRealtimePenalties', '⚠️ Erro ao buscar evaluators:', evaluatorsResult.error)
          }

          // Cache the enrichment data
          penaltiesEnrichCacheRef.current = {
            data: { teamMap, evaluatorMap },
            timestamp: now
          }
        }

        // Format penalties com enrichment data
        const formatted = penaltiesData.map((p: any) => ({
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

        // Detectar penalidades novas e tocar som
        if (!isFirstRenderRef.current) {
          formatted.forEach((penalty: any) => {
            if (!previousPenaltyIdsRef.current.has(penalty.id)) {
              DEBUG.log('useRealtimePenalties', `🔊 PENALTY NOVA: ${penalty.team_name}`)
              play('penalty')
            }
          })
        }

        // Atualizar conjunto de IDs
        previousPenaltyIdsRef.current = new Set(formatted.map((p: any) => p.id))

        // Marcar que primeira renderização foi feita
        if (isFirstRenderRef.current) {
          isFirstRenderRef.current = false
        }

        setPenalties(formatted)
      } catch (err) {
        DEBUG.error('useRealtimePenalties', 'Error:', err)
      } finally {
        setLoading(false)
        isFetching = false
      }
    }

    // Buscar imediatamente
    fetchPenalties()

    // 🔄 Polling a cada 3 segundos
    // IMPORTANTE: 500ms era muito agressivo (60+ queries/min)
    // 3s = 20 req/min (muito mais razoável)
    // Penalidades não mudam tão frequentemente
    let pollInterval: NodeJS.Timeout
    const timeoutId = setTimeout(() => {
      pollInterval = setInterval(fetchPenalties, 3000)
    }, 0)

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