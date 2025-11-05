'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  useEffect(() => {
    let isFetching = false

    const fetchRanking = async () => {
      if (isFetching) return
      
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

    // 🔄 Polling a cada 2 segundos (otimizado para Supabase free tier)
    const pollInterval = setInterval(fetchRanking, 2000)

    // Cleanup
    return () => {
      clearInterval(pollInterval)
    }
  }, [supabase])

  return { ranking, loading }
}

// Hook para fase com WebSocket Realtime
export function useRealtimePhase() {
  const [phase, setPhase] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
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

    // 🔄 Polling a cada 2 segundos (otimizado para Supabase free tier)
    const pollInterval = setInterval(fetchPhase, 2000)

    // Cleanup
    return () => {
      clearInterval(pollInterval)
    }
  }, [supabase])

  return { phase, loading }
}

// Hook para status dos avaliadores com Polling (WebSocket removido)
export function useRealtimeEvaluators() {
  const [evaluators, setEvaluators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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

    // 🔄 Polling a cada 5 segundos (avaliadores não mudam tão rápido)
    const pollInterval = setInterval(fetchEvaluators, 5000)

    // Cleanup
    return () => {
      clearInterval(pollInterval)
    }
  }, [supabase])

  return { evaluators, loading }
}