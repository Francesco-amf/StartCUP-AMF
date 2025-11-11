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

    // 🔄 Polling sincronizado a cada 500ms (padrão de toda dashboard)
    // IMPORTANTE: Manter em sync com useRealtimePhase (500ms) para evitar interferência de re-renders
    // Quando todos polling rodam no mesmo intervalo, evita caos de atualizações assincronas
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

  useEffect(() => {
    // Detectar quando a aba está visível ou oculta
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    let isFetching = false // � Evitar chamadas simultâneas

    // �🚀 Usar RPC para buscar tudo em UMA query (otimização)
    const fetchPhase = async () => {
      if (isFetching) return // 🛡️ Skip se já estiver buscando
      
      isFetching = true
      try {
        const { data, error } = await supabase.rpc('get_current_phase_data')

        if (error) {
          console.error('[useRealtimePhase] RPC error:', error)
          setLoading(false)
          return
        }

        if (!data || !data.event_config) {
          setPhase(null)
          setLoading(false)
          return
        }

        const eventConfig = data.event_config
        const phaseInfo = data.phase || getPhaseInfo(eventConfig.current_phase)
        const activeQuest = data.active_quest

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
        setLoading(false)
      } finally {
        isFetching = false
      }
    }

    // Buscar imediatamente
    fetchPhase()

    // 🔄 Polling sincronizado a cada 500ms (adaptado ao CurrentQuestTimer para resposta instantânea)
    const pollInterval = setInterval(fetchPhase, 500) // 4x mais rápido! Sincronizado com CurrentQuestTimer (500ms)

    // Cleanup
    return () => {
      clearInterval(pollInterval)
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

    // 🔄 Polling sincronizado a cada 500ms (padrão de toda dashboard)
    // IMPORTANTE: Manter em sync com useRealtimePhase e useRealtimeRanking (500ms)
    const pollInterval = setInterval(fetchPenalties, 500)

    // Cleanup
    return () => {
      clearInterval(pollInterval)
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

  useEffect(() => {
    let isFetching = false

    const fetchEvaluators = async () => {
      if (isFetching) return
      
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

    // 🔄 Polling sincronizado a cada 500ms (padrão de toda dashboard)
    // IMPORTANTE: Manter em sync com useRealtimePhase, useRealtimeRanking e useRealtimePenalties (500ms)
    const pollInterval = setInterval(fetchEvaluators, 500)

    // Cleanup
    return () => {
      clearInterval(pollInterval)
    }
  }, [supabase, play])

  return { evaluators, loading }
}