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

        // Calcular quando a fase atual começou
        // Se houver phase_started_at, usar isso
        // Caso contrário, calcular baseado em quando o evento começou + duração das fases anteriores
        let phaseStartTime = null

        if (data.current_phase > 0 && data.event_started) {
          // Preferir phase_started_at se existir
          if (data.phase_started_at) {
            phaseStartTime = data.phase_started_at
            console.log(`📍 Phase ${data.current_phase} using phase_started_at: ${phaseStartTime}`)
          } else if (data.event_start_time) {
            // ⚠️ CRÍTICO: O banco armazena timestamps SEM timezone
            // Eles foram salvos em horário local (Brasília/UTC-3) MAS sem o Z
            // Quando fazemos new Date("2025-11-02T05:34:25"), JS interpreta como LOCAL
            // e diferente de quando foi salvo!
            //
            // SOLUÇÃO: Usar new Date() para GET now() em local time também
            // Depois calcular difference, que fica correto mesmo com timezone diferente

            const prevPhaseDuration = Array.from({ length: data.current_phase })
              .reduce((sum, _, i) => sum + getPhaseInfo(i).duration_minutes, 0)

            // Parse como LOCAL time (sem Z)
            // Isso faz JS interpretar no timezone local do usuário
            const eventStartTime = new Date(data.event_start_time).getTime()
            const now = new Date().getTime()

            // Calcular quando a fase atual deveria ter começado
            const prevPhaseDurationMs = prevPhaseDuration * 60 * 1000
            const phaseStartMs = eventStartTime + prevPhaseDurationMs

            // IMPORTANTE: Converter para ISO string (vai incluir Z porque é UTC)
            // Mas internamente o cálculo foi feito com local time, então fica correto
            phaseStartTime = new Date(phaseStartMs).toISOString()

            const actualElapsedMs = now - eventStartTime
            const actualElapsedMins = actualElapsedMs / (60 * 1000)

            console.log(`🔍 Phase ${data.current_phase} Debug:`)
            console.log(`   DB event_start_time (local): ${data.event_start_time}`)
            console.log(`   Parsed as LOCAL timestamp (ms): ${eventStartTime}`)
            console.log(`   Current time (ms): ${now}`)
            console.log(`   Actual elapsed since event: ${actualElapsedMins.toFixed(1)} min`)
            console.log(`   Previous phases total: ${prevPhaseDuration} min`)
            console.log(`   PHASE START should be at: ${new Date(phaseStartMs).toLocaleString()}`)
            console.log(`   Phase should start ISO: ${phaseStartTime}`)
            console.log(`   Current phase duration: ${getPhaseInfo(data.current_phase).duration_minutes} min`)
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
          // Usar o timestamp de quando o evento começou
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