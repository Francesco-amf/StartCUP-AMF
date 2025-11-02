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
    // Função para buscar fase e quest ativa
    const fetchPhase = async () => {
      const eventConfigId = process.env.NEXT_PUBLIC_EVENT_CONFIG_ID || '00000000-0000-0000-0000-000000000001'
      const { data, error } = await supabase
        .from('event_config')
        .select('*')
        .eq('id', eventConfigId)
        .single()

      if (!error && data) {
        // Mapear event_started/event_ended para event_status
        const phaseInfo = getPhaseInfo(data.current_phase)

        // Obter timestamp de quando a fase atual começou
        let phaseStartTime = null

        if (data.current_phase > 0 && data.event_started) {
          // ✅ Usar phase_X_start_time do BD (salvo quando admin ativa a fase)
          // Coluna dinâmica: phase_1_start_time, phase_2_start_time, etc.
          const phaseStartColumn = `phase_${data.current_phase}_start_time`
          let rawTimestamp = data[phaseStartColumn]

          // ⚠️ TIMEZONE FIX: Se há offset de -3h (Brasília UTC-3)
          // O timestamp foi salvo com offset. Precisamos compensar.
          // Brasília é UTC-3, então adicionar 3 horas (10800000 ms)
          if (rawTimestamp) {
            const date = new Date(rawTimestamp)
            const offsetMs = 3 * 60 * 60 * 1000 // 3 hours
            const adjustedMs = date.getTime() + offsetMs
            phaseStartTime = new Date(adjustedMs).toISOString()

            console.log(`📍 Phase ${data.current_phase}:`)
            console.log(`   ${phaseStartColumn} (raw): ${rawTimestamp}`)
            console.log(`   ${phaseStartColumn} (adjusted): ${phaseStartTime}`)
            console.log(`   phase_duration: ${getPhaseInfo(data.current_phase).duration_minutes} min`)
          }
        }

        // Buscar quest ativa para a fase atual
        let activeQuest = null
        if (data.current_phase > 0) {
          const { data: questData } = await supabase
            .from('quests')
            .select(`
              id,
              name,
              description,
              max_points,
              order_index,
              duration_minutes,
              deliverable_type,
              status,
              phase:phase_id (
                id,
                name,
                order_index
              )
            `)
            .in('status', ['scheduled', 'active'])
            .order('order_index')
            .limit(1)

          if (questData && questData.length > 0) {
            activeQuest = questData[0]
          }
        }

        const phaseData = {
          ...data,
          event_status: data.event_started
            ? (data.event_ended ? 'ended' : 'running')
            : 'not_started',
          // Adicionar phase_started_at como alias para o campo phase_X_start_time
          // Isso facilita o uso nos componentes
          phase_started_at: phaseStartTime,
          phases: phaseInfo,
          // Adicionar quest ativa aos dados da fase
          active_quest: activeQuest
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

// Hook para status dos avaliadores com auto-refresh
export function useRealtimeEvaluators(refreshInterval = 5000) {
  const [evaluators, setEvaluators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Função para buscar avaliadores
    const fetchEvaluators = async () => {
      const { data, error } = await supabase
        .from('evaluators')
        .select('id, name, email, specialty, is_online')
        .order('is_online', { ascending: false })
        .order('name', { ascending: true })

      if (!error && data) {
        setEvaluators(data)
      }
      setLoading(false)
    }

    // Buscar imediatamente
    fetchEvaluators()

    // Configurar intervalo de atualização
    const interval = setInterval(fetchEvaluators, refreshInterval)

    // Cleanup
    return () => {
      clearInterval(interval)
    }
  }, [refreshInterval])

  return { evaluators, loading }
}