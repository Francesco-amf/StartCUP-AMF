'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Helper para mapear número da fase para nome e duração
function getPhaseInfo(phase: number): { name: string; duration_minutes: number } {
  const phases = [
    { name: 'Preparação', duration_minutes: 0 },
    { name: 'Fase 1: Descoberta', duration_minutes: 150 }, // 2h30min
    { name: 'Fase 2: Criação', duration_minutes: 210 },    // 3h30min
    { name: 'Fase 3: Estratégia', duration_minutes: 90 },  // 1h30min
    { name: 'Fase 4: Refinamento', duration_minutes: 120 }, // 2h
    { name: 'Fase 5: Pitch Final', duration_minutes: 150 }  // 2h30min
  ]
  return phases[phase] || { name: 'Fase Desconhecida', duration_minutes: 0 }
}

// Hook para ranking com auto-refresh
export function useRealtimeRanking(refreshInterval = 5000) {
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Função para buscar ranking
    const fetchRanking = async () => {
      const { data, error } = await supabase
        .from('live_ranking')
        .select('*')
        .order('total_points', { ascending: false })

      if (!error && data) {
        setRanking(data)
      }
      setLoading(false)
    }

    // Buscar imediatamente
    fetchRanking()

    // Configurar intervalo de atualização
    const interval = setInterval(fetchRanking, refreshInterval)

    // Cleanup
    return () => {
      clearInterval(interval)
    }
  }, [refreshInterval])

  return { ranking, loading }
}

// Hook para fase com auto-refresh
export function useRealtimePhase(refreshInterval = 5000) {
  const [phase, setPhase] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Função para buscar fase
    const fetchPhase = async () => {
      const { data, error } = await supabase
        .from('event_config')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single()

      if (!error && data) {
        // Mapear event_started/event_ended para event_status
        const phaseInfo = getPhaseInfo(data.current_phase)

        // Determinar qual timestamp de fase usar
        const phaseStartTime =
          data.current_phase === 1 ? data.phase_1_start_time :
          data.current_phase === 2 ? data.phase_2_start_time :
          data.current_phase === 3 ? data.phase_3_start_time :
          data.current_phase === 4 ? data.phase_4_start_time :
          data.current_phase === 5 ? data.phase_5_start_time :
          data.event_start_time

        const phaseData = {
          ...data,
          event_status: data.event_started
            ? (data.event_ended ? 'ended' : 'running')
            : 'not_started',
          // Usar o timestamp correto da fase atual
          phase_started_at: phaseStartTime,
          phases: phaseInfo
        }
        setPhase(phaseData)
      }
      setLoading(false)
    }

    // Buscar imediatamente
    fetchPhase()

    // Configurar intervalo de atualização
    const interval = setInterval(fetchPhase, refreshInterval)

    // Cleanup
    return () => {
      clearInterval(interval)
    }
  }, [refreshInterval])

  return { phase, loading }
}